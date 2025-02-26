/*
import { Storage } from "./models.js"

const AGENT_CHAT_COLUMNS = "cid,uid,profile_uri as canonicalUri,created,updated,aimodel,history";

export class MySQLStorage extends Storage {

    async fetchAccountFields( uid: UserId, fields?: string ) {
        const sql = `SELECT ${fields ?? "*"} FROM users WHERE uid=?`;
        return await queryFirstRow<Account>( sql , [uid] );
    },

    async recordChatCost( { uid, canonicalUri }: AgentChatKeys, cost: number | undefined ) {
        if( !cost )
            return;

        await updateDB(
            "UPDATE users SET credit=credit-? WHERE uid=?",
            [cost,uid],
            "Failed to update user credit with inference cost"
        );

        await updateDB(
            "UPDATE agent_chats SET cost=cost+? WHERE uid=? AND profile_uri=?",
            [cost,uid,canonicalUri],
            "Failed to update chat with inference cost"
        ); 
    },

    async saveClientSession( sessionKey: string, profileUri: string, agentUrl: string ): Promise<number> {
        const params = [{
            session_key: sessionKey,
            profile_uri: profileUri,
            agent_url: agentUrl
        }];
        const { insertId: id } = await queryResult( "INSERT INTO client_agent_sessions SET ?", params );
        return id;
    },

    async fetchClientSession( id: number ) {
        const session = await queryFirstRow<any>( "SELECT * FROM client_agent_sessions WHERE id=?", [id] );
        return session ? { 
            id,
            created: session.created,
            sessionKey: session.session_key,
            profileUri: session.profile_uri,
            agentUrl: session.agent_url
        } as ClientAgentSession : null;
    },

    async saveChallenge( challenge: string ) {
        const { insertId: id } = await queryResult( 'INSERT INTO client_agent_challenges SET ?', [{challenge}] );
        return id;
    },

    async deleteChallenge( id: number ) {
        await queryResult( 'DELETE FROM client_agent_challenges WHERE id=?', [id] );
    }

    // profileUri might canonical OR vanity => returned agent chat is only canonical
    async ensureAgentChat( uid: number | string, profileUri: ProfileURI, messages?: ChatMessage[] ) {
        if( !messages )
            messages = [];

        const canonicalUri = await resolveCanonicalProfileUri( profileUri );
        const existingChat = await queryFirstRow<AgentChat>(
            `SELECT ${AGENT_CHAT_COLUMNS} FROM agent_chats WHERE uid=? AND profile_uri=?`,
            [uid,canonicalUri]
        );
        if( existingChat )
            return existingChat;

        const insert = {
            uid,
            profile_uri: canonicalUri,
            history: JSON.stringify({messages})
        };
        const { insertId: cid } = await queryResult( "INSERT INTO agent_chats SET ?", [insert] );
        return {
            cid,
            uid,
            canonicalUri,
            created: new Date(),
            history: { messages }
        } as AgentChat;
    },

    async fetchChatHistory( uid: number | string, profileUri: string ) {
        return (await queryFirstRow<AgentChatHistory>(
            "SELECT history FROM agent_chats WHERE uid=? AND profile_uri=?",
            [uid,profileUri]
        ))?.history;   
    }
}
*/