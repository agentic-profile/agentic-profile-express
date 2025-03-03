import {
    CanonicalURI,
    ChallengeRecord,
    ClientAgentSession
} from "@agentic-profile/auth";

import {
    AgentChat,
    AgentChatKey,
    ChatMessage,
    ChatMessageHistory
} from "../../chat/models.js";

import {
    Account,
    NewAccountFields,
    Storage,
    UserId
} from "../models.js";
import {
    queryFirstRow,
    queryResult,
    queryRows,
    updateDB
} from "./util.js";
import { ServerError } from "../../util/net.js";


const AGENT_CHAT_COLUMNS = "uid,pathname,canonical_uri as canonicalUri,client_agent_url as clientAgentUrl,created,updated,aimodel,cost,history";

const MATCHES_AGENT_CHAT = "uid=? AND pathname=? AND canonical_uri=? AND client_agent_url=?";

const INSERT_MESSAGE = `UPDATE agent_chats
    SET history = JSON_SET(
        COALESCE(history, JSON_OBJECT('messages', JSON_ARRAY())), 
        '$.messages', JSON_ARRAY_APPEND(
            COALESCE(history->'$.messages', JSON_ARRAY()), 
            '$', CAST(? AS JSON)
        )
    )
    WHERE ${MATCHES_AGENT_CHAT}`;

function matchesChatParams( { uid, pathname, canonicalUri, clientAgentUrl }: AgentChatKey ) {
    return [ uid, pathname, canonicalUri, clientAgentUrl ];
}

export class MySQLStorage implements Storage {

    //
    // Accounts
    //

    async createAccount( fields: NewAccountFields ) {
        const { uid, name, alias, credit = 2 } = fields;
        const account = { name, alias, credit, created: new Date() } as Account;

        if( uid ) {
            const found = await queryFirstRow<Account>("SELECT name FROM users WHERE uid=?",[uid]);
            if( found )
                throw new ServerError([4],"Account id is already in use: " + uid);
            account.uid = uid;
        } 

        const { insertId } = await queryResult( "INSERT INTO users SET ?", [account] );
        account.uid = insertId;

        console.log( 'createAccount', account );
        return account;  
    }

    //
    // Chat
    //

    async updateChatHistory( key: AgentChatKey, history: ChatMessageHistory ) {
        await queryResult(
            `UPDATE agent_chats SET history=? WHERE ${MATCHES_AGENT_CHAT}`,
            [ JSON.stringify(history), ...matchesChatParams(key) ]
        )
    }

    async insertChatMessage( key: AgentChatKey, message: ChatMessage ) {
        const messageJSON = JSON.stringify(message);
        await queryResult( INSERT_MESSAGE, [ messageJSON, ...matchesChatParams(key) ] );
    }

    async recordChatCost( key: AgentChatKey, cost: number | undefined ) {
        if( !cost )
            return;

        await updateDB(
            "UPDATE users SET credit=credit-? WHERE uid=?",
            [cost,key.uid],
            "Failed to update user credit with inference cost"
        );

        await updateDB(
            `UPDATE agent_chats SET cost=cost+? WHERE ${MATCHES_AGENT_CHAT}`,
            [ cost, ...matchesChatParams(key) ],
            "Failed to update chat with inference cost"
        ); 
    }

    // profileUri might canonical OR vanity => returned agent chat is only canonical
    async ensureAgentChat( key: AgentChatKey, messages?: ChatMessage[] ) {
        if( !messages )
            messages = [];

        //const canonicalUri = await resolveCanonicalProfileUri( profileUri );
        //const existingChat = await queryFirstRow<AgentChat>(
        //    `SELECT ${AGENT_CHAT_COLUMNS} FROM agent_chats WHERE uid=? AND profile_uri=?`,
        //    [uid,canonicalUri]
        //);
        const existingChat = await this.fetchAgentChat( key );

        if( existingChat )
            return existingChat;

        const insert = {
            uid: key.uid,
            pathname: key.pathname,
            canonical_uri: key.canonicalUri,
            client_agent_url: key.clientAgentUrl,
            history: JSON.stringify({messages})
        };
        await queryResult( "INSERT INTO agent_chats SET ?", [insert] );
        return {
            ...key,
            created: new Date(),
            history: { messages }
        } as AgentChat;
    }

    async fetchAgentChat( key: AgentChatKey ) {
        return await queryFirstRow<AgentChat>(
            `SELECT ${AGENT_CHAT_COLUMNS} FROM agent_chats WHERE ${MATCHES_AGENT_CHAT}`,
            matchesChatParams(key)
        ) ?? undefined;  
    }


    //
    // Account
    //

    async fetchAccountFields( uid: UserId, fields?: string ) {
        const sql = `SELECT ${fields ?? "*"} FROM users WHERE uid=?`;
        return await queryFirstRow<Account>( sql, [uid] ) ?? undefined;
    }


    //
    // Sessions, where we have authenticated either a general agentic profile (no agent_url)
    // or a specific agent of an agentic profile and we are sure the agent signed the
    // server challenge and attestation
    //

    async saveClientSession( sessionKey: string, canonicalUri: CanonicalURI, agentUrl?: string ): Promise<number> {
        const params = [{
            session_key: sessionKey,
            canonical_uri: canonicalUri,
            agent_url: agentUrl
        }];
        const { insertId: id } = await queryResult( "INSERT INTO client_agent_sessions SET ?", params );
        return id;
    }

    async fetchClientSession( id: number ) {
        const session = await queryFirstRow<any>( "SELECT * FROM client_agent_sessions WHERE id=?", [id] );
        return session ? { 
            id,
            created: session.created,
            sessionKey: session.session_key,
            canonicalUri: session.canonical_uri,
            agentUrl: session.agent_url
        } as ClientAgentSession : undefined;
    }

    //
    // Challenges, where server agent challenges client agent
    //

    async saveChallenge( challenge: string ) {
        const { insertId: id } = await queryResult( 'INSERT INTO client_agent_challenges SET ?', [{challenge}] );
        return id;
    }

    async fetchChallenge( id: number ) {
        return await queryFirstRow<ChallengeRecord>(
            "SELECT id,challenge,created FROM client_agent_challenges WHERE id=?",
            [id]
        ) ?? undefined;
    }

    async deleteChallenge( id: number ) {
        await queryResult( 'DELETE FROM client_agent_challenges WHERE id=?', [id] );
    }

    //
    // Debug
    //

    async dump() {
        const accounts = await queryRows<Account>( "SELECT uid,created,updated,name,alias,credit FROM users" );
        const challenges = await queryRows<ChallengeRecord>( "SELECT * FROM client_agent_challenges" );
        const clientSessions = await queryRows<any>( "SELECT * FROM client_agent_sessions" );
        const agentChats = await queryRows<AgentChat>( "SELECT uid,created,updated,pathname,canonical_uri,client_agent_url,cost,aimodel,history FROM agent_chats" );

        return {
            database: "MySQL",
            accounts,
            challenges,
            clientSessions,
            agentChats
        }
    }
}

