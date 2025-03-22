import {
    ClientAgentSession,
    ClientAgentSessionUpdates
} from "@agentic-profile/auth";
import { ChatMessage } from "@agentic-profile/common";
import {
    AgentChat,
    AgentChatKey,
    ChatMessageHistory
} from "@agentic-profile/chat";

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


const AGENT_CHAT_COLUMNS = "uid,user_agent_did as userAgentDid,peer_agent_did as peerAgentDid,created,updated,aimodel,cost,history";

const MATCHES_AGENT_CHAT = "uid=? AND user_agent_did=? AND peer_agent_did=?";

const INSERT_MESSAGE = `UPDATE agent_chats
    SET history = JSON_SET(
        COALESCE(history, JSON_OBJECT('messages', JSON_ARRAY())), 
        '$.messages', JSON_ARRAY_APPEND(
            COALESCE(history->'$.messages', JSON_ARRAY()), 
            '$', CAST(? AS JSON)
        )
    )
    WHERE ${MATCHES_AGENT_CHAT}`;

function matchesChatParams( { uid, userAgentDid, peerAgentDid }: AgentChatKey ) {
    return [ uid, userAgentDid, peerAgentDid ];
}

export class MySQLStorage implements Storage {

    //
    // Accounts
    //

    async createAccount( fields: NewAccountFields ) {
        const { uid, name, credit = 2 } = fields;
        const account = { name, credit, created: new Date() } as Account;

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

    async ensureAgentChat( key: AgentChatKey, messages?: ChatMessage[] ) {
        if( !messages )
            messages = [];

        const existingChat = await this.fetchAgentChat( key );

        if( existingChat )
            return existingChat;

        const insert = {
            uid: key.uid,
            user_agent_did: key.userAgentDid,
            peer_agent_did: key.peerAgentDid,
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
        const sql = `SELECT ${AGENT_CHAT_COLUMNS} FROM agent_chats WHERE ${MATCHES_AGENT_CHAT}`;
        const params = matchesChatParams(key);
        console.log( 'fetchAgentChat', sql, params );
        return await queryFirstRow<AgentChat>( sql, params ) ?? undefined;  
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

    async createClientAgentSession( challenge: string ) {
        const { insertId: id } = await queryResult( 'INSERT INTO client_agent_sessions SET ?', [{challenge}] );
        return id;
    }

    async fetchClientAgentSession( id: number ) {
        return await queryFirstRow<ClientAgentSession>(
            "SELECT id,created,challenge,agent_did as agentDid,auth_token as authToken FROM client_agent_sessions WHERE id=?",
            [id]
        ) ?? undefined;
    }

    async updateClientAgentSession( id: number, updates: ClientAgentSessionUpdates ) {
        const fields = {} as any;
        if( updates.agentDid !== undefined )
            fields.agent_did = updates.agentDid;
        if( updates.authToken !== undefined )
            fields.auth_token = updates.authToken;

        await queryResult( 'UPDATE client_agent_sessions SET ? WHERE id=?', [fields,id] );
    }

    //
    // Debug
    //

    async dump() {
        const accounts = await queryRows<Account>( "SELECT uid,created,updated,name,roles,media,social,credit FROM users" );
        const clientSessions = await queryRows<any>( "SELECT * FROM client_agent_sessions" );
        const agentChats = await queryRows<AgentChat>( "SELECT * FROM agent_chats" );

        return {
            database: "MySQL",
            accounts,
            clientSessions,
            agentChats
        }
    }
}
