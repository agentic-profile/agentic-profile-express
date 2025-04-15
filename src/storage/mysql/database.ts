import log from "loglevel";
import {
    ClientAgentSession,
    ClientAgentSessionUpdates,
    RemoteAgentSession,
    RemoteAgentSessionKey,
    RemoteAgentSessionUpdate
} from "@agentic-profile/auth";
import {
    AgenticProfile,
    ChatMessage,
    ChatResolution,
    DID,
    UserID
} from "@agentic-profile/common";
import {
    AgentChat,
    AgentChatKey,
    ChatMessageHistory
} from "@agentic-profile/chat";
import { mysql } from "@agentic-profile/express-common";
const {
    queryFirstRow,
    queryResult,
    queryRows,
    updateDB
} = mysql;

import {
    Account,
    CreateAccount,
    Storage
} from "../models.js";


interface AgenticProfileCache {
    profileDid: string,
    agenticProfile: AgenticProfile,
    updated: Date
}

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

    async createAccount( { options, fields }: CreateAccount ) {
        const { name, credit = 2 } = fields;
        const account = { name, credit, created: new Date() } as Account;

        const { uid } = options;
        if( uid ) {
            account.uid = uid;
            const found = await queryFirstRow<Account>("SELECT name FROM users WHERE uid=?",[uid]);
            if( found ) {
                // OK to simply update
                await queryResult("UPDATE users SET ? WHERE uid=?",[account,uid]);
                return account;
            }
        } 

        const { insertId } = await queryResult( "INSERT INTO users SET ?", [account] );
        account.uid = insertId;

        log.info( 'createAccount', account );
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

    async updateChatResolution( key: AgentChatKey, userResolution: ChatResolution | null | undefined, peerResolution: ChatResolution | null | undefined ) {
        if( userResolution === undefined && peerResolution === undefined )
            return; // nothing to do

        const update = {} as any;
        if( userResolution !== undefined )
            update.user_resolution = userResolution ? JSON.stringify( userResolution ) : null;
        if( peerResolution !== undefined )
            update.peer_resolution = peerResolution ? JSON.stringify( peerResolution ) : null;

        await queryResult(
            `UPDATE agent_chats SET ? WHERE ${MATCHES_AGENT_CHAT}`,
            [ update, ...matchesChatParams(key) ]
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
        const result = await queryResult( "INSERT IGNORE INTO agent_chats SET ?", [insert] );
        log.debug( "ensureAgentChat result", result );
        if( result.affectedRows === 0 ) {
            log.warn( 'ensureAgentChat failed to insert new chat - duplicate key', key );
            const chat = await this.fetchAgentChat( key ); // try again...
            if( !chat )
                throw new Error(`Failed to ensure agent chat ${key}` );
            else 
                return chat;
        }
        return {
            ...key,
            created: new Date(),
            history: { messages }
        } as AgentChat;
    }

    async fetchAgentChat( key: AgentChatKey ) {
        const sql = `SELECT ${AGENT_CHAT_COLUMNS} FROM agent_chats WHERE ${MATCHES_AGENT_CHAT}`;
        const params = matchesChatParams(key);
        const chat = await queryFirstRow<AgentChat>( sql, params ) ?? undefined;  
        log.debug( 'fetchAgentChat', sql, params, chat );
        return chat;
    }


    //
    // Account
    //

    async fetchAccountFields( uid: UserID, fields?: string ) {
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
    // Remote agent sessions - I am client connecting to remote/agent
    //

    async fetchRemoteAgentSession( key: RemoteAgentSessionKey ) {
        const COLUMNS = `uid,user_agent_did as userAgentDid,
 NULLIF(peer_agent_did, '') as peerAgentDid,
 NULLIF(peer_service_url, '') as peerServiceUrl,
 created,auth_token as authToken`;
        return await queryFirstRow<RemoteAgentSession>(
            `SELECT ${COLUMNS} FROM remote_agent_sessions WHERE uid=? AND user_agent_did=? AND peer_agent_did=? AND peer_service_url=?`,
            [ key.uid, key.userAgentDid, key.peerAgentDid ?? "", key.peerServiceUrl ?? ""]
        ) ?? undefined;
    }

    async updateRemoteAgentSession( key: RemoteAgentSessionKey, update: RemoteAgentSessionUpdate ) {
        const updateFields = {
            created: new Date(),
            auth_token: update.authToken
        };
        const insert = {
            ...updateFields,
            uid: key.uid,
            user_agent_did: key.userAgentDid,
            peer_agent_did: key.peerAgentDid ?? "",
            peer_service_url: key.peerServiceUrl ?? ""
        }
        await queryResult(
            "INSERT INTO remote_agent_sessions SET ? ON DUPLICATE KEY UPDATE ?",
            [insert,updateFields]
        );
    }

    async deleteRemoteAgentSession( key: RemoteAgentSessionKey ) {
        await queryResult( "DELETE FROM remote_agent_sessions WHERE uid=? AND user_agent_did=? AND peer_agent_did=? AND peer_service_url=?",
            [ key.uid, key.userAgentDid, key.peerAgentDid ?? "", key.peerServiceUrl ?? ""]
        );
    }

    //
    // Agentic Profile Cache
    //

    async cacheAgenticProfile( profile: AgenticProfile ) {
        const update = {
            agentic_profile: JSON.stringify(profile)
        };
        const insert = {
            ...update,
            profile_did: profile.id,
        };
        await mysql.queryResult(
            "INSERT INTO agentic_profile_cache SET ? ON DUPLICATE KEY UPDATE ?",
            [insert,update]
        );
    }

    async getCachedAgenticProfile( did: DID ) {
        const AGENTIC_PROFILE_CACHE_COLUMNS = "profile_did as profileDid,agentic_profile as agenticProfile,updated";
        const cached = await queryFirstRow<AgenticProfileCache>(
            `SELECT ${AGENTIC_PROFILE_CACHE_COLUMNS} FROM agentic_profile_cache WHERE profile_did=?`,
            [did]
        );
        if( cached && !isExpired( cached ) )
            return cached.agenticProfile;
        else
            return undefined;
    }

    //
    // Debug
    //

    async dump() {
        const accounts = await queryRows<Account>( "SELECT uid,created,updated,name,roles,media,social,credit FROM users" );
        const clientSessions = await queryRows<any>( "SELECT * FROM client_agent_sessions" );
        const remoteSessions = await queryRows<any>( "SELECT * FROM remote_agent_sessions" );
        const agentChats = await queryRows<AgentChat>( "SELECT * FROM agent_chats" );

        return {
            database: "MySQL",
            accounts,
            clientSessions,
            remoteSessions,
            agentChats
        }
    }
}

function isExpired( cached: AgenticProfileCache ) {
    const updated = new Date( cached.updated );
    const now = new Date();
    const ttl = cached.agenticProfile.ttl ?? 86400;
    const result = updated.getTime() + (ttl * 1000) < now.getTime();
    return result;
}
