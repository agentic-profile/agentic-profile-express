import {
    CanonicalURI,
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
    UserId
} from "../models.js";
import {
    queryFirstRow,
    queryResult,
    updateDB
} from "./util.js";

const AGENT_CHAT_COLUMNS = "cid,uid,pathname,canonical_uri as canonicalUri,client_agent_url as clientAgentUrl,created,updated,aimodel,cost,history";

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

function matchesChatParams( key: AgentChatKey ) {
    return [ key.uid, key.pathname, key.canonicalUri, key.clientAgentUrl ];
}

export class MySQLStorage extends Storage {

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
        );  
    }


    //
    // Account
    //

    async fetchAccountFields( uid: UserId, fields?: string ) {
        const sql = `SELECT ${fields ?? "*"} FROM users WHERE uid=?`;
        return await queryFirstRow<Account>( sql, [uid] );
    }


    //
    // Sessions and challenges
    //

    async saveClientSession( sessionKey: string, canonicalUri: CanonicalURI, agentUrl: string ): Promise<number> {
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
        } as ClientAgentSession : null;
    }

    async saveChallenge( challenge: string ) {
        const { insertId: id } = await queryResult( 'INSERT INTO client_agent_challenges SET ?', [{challenge}] );
        return id;
    }

    async deleteChallenge( id: number ) {
        await queryResult( 'DELETE FROM client_agent_challenges WHERE id=?', [id] );
    }
}

