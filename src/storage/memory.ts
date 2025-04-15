import {
    AgenticProfile,
    ChatMessage,
    ChatResolution,
    DID,
    UserID
} from "@agentic-profile/common";
import {
    ClientAgentSession,
    ClientAgentSessionUpdates,
    RemoteAgentSession,
    RemoteAgentSessionKey,
    RemoteAgentSessionUpdate
} from "@agentic-profile/auth";
import {
    AgentChat,
    AgentChatKey,
    ChatMessageHistory
} from "@agentic-profile/chat";
import { ServerError } from "@agentic-profile/express-common";

import {
    Account,
    CreateAccount,
    Storage
} from "./models.js";


let nextUserId = 1;
const accounts = new Map<string,Account>();

let nextSessionId = 1;
const clientSessions = new Map<number,ClientAgentSession>();

const agentChats = new Map<string,AgentChat>();
const remoteSessions = new Map<string,RemoteAgentSession>();

const profileCache = new Map<string,AgenticProfile>();

function resolveKey( key: AgentChatKey ) {
    return `${key.uid};${key.userAgentDid};${key.peerAgentDid}`;
}

function mapToObject<K extends PropertyKey, V>(map: Map<K, V>): Record<K, V> {
    return Object.fromEntries(map) as Record<K, V>;
}

export class InMemoryStorage implements Storage {

    async dump() {
        return {
            database: 'memory',
            accounts: mapToObject( accounts ),
            clientSessions: mapToObject( clientSessions ),
            remoteSessions: mapToObject( remoteSessions ),
            agentChats: mapToObject( agentChats ),
            profileCache: mapToObject( profileCache )
        }
    }

    //
    // Chat
    //

    async ensureAgentChat( key: AgentChatKey, messages?: ChatMessage[] ) {
        if( !messages )
            messages = [];

        const existingChat = await this.fetchAgentChat( key );
        if( existingChat )
            return existingChat;

        let now = new Date();
        const newChat = {
            ...key,
            created: now,
            updated: now,
            cost: 0,
            history: { messages }
        } as AgentChat;
        agentChats.set( resolveKey( key ), newChat );

        return newChat;
    }

    async insertChatMessage( key: AgentChatKey, message: ChatMessage, ignoreFailure?: boolean ) {
        const chat = await this.fetchAgentChat( key );
        if( chat )
            chat.history.messages.push( message ); 
        else if( !ignoreFailure )
            throw new ServerError([4],'Insert chat message failed to find chat');
    }

    async updateChatHistory( key: AgentChatKey, history: ChatMessageHistory ) {
        const chat = await this.fetchAgentChat( key );
        if( !chat )
            throw new ServerError([4],'Update chat history failed to find chat');
        else
            chat.history = history; 
    }

    async updateChatResolution( key: AgentChatKey, userResolution: ChatResolution | null | undefined, peerResolution: ChatResolution | null | undefined ) {
        const chat = await this.fetchAgentChat( key );
        if( !chat )
            throw new ServerError([4],'Update chat resolution failed to find chat');
        
        if( userResolution !== undefined )
            chat.userResolution = userResolution ?? undefined;
        if( peerResolution !== undefined )
            chat.peerResolution = peerResolution ?? undefined;
    }

    async fetchAgentChat( key: AgentChatKey ) {
        return agentChats.get( resolveKey( key ) );    
    }


    //
    // Accounts
    //

    async createAccount( { options, fields }: CreateAccount ) {
        let uid;
        if( options?.uid ) {
            uid = +options.uid;
            if( uid >= nextUserId )
                nextUserId = uid + 1;
        } else
            uid = nextUserId++;

        const { name, credit = 2 } = fields;
        const account = { name, credit, uid, created: new Date() };
        accounts.set( ''+uid, account );
        return account;
    }

    async fetchAccountFields( uid: UserID, fields?: string ) {
        return accounts.get( ''+uid );
    }

    async recordChatCost( key: AgentChatKey, cost: number | undefined ) {
        if( !cost )
            return; // nothing to do!

        // deduct from users credit
        const account = accounts.get( ''+key.uid );
        if( !account )
            throw new ServerError([4],"Invalid user id while recording chat cost");
        account.credit = account.credit ? account.credit - cost : -cost;

        // add to cumulative chat cost
        const chat = await this.fetchAgentChat( key );
        if( !chat )
            throw new ServerError([4],"Invalid chat key while recording chat cost");
        chat.cost += cost;
    }

    //
    // Client sessions - agents are contacting me as a service.  I give them
    // challenges and then accept their authTokens
    //

    async createClientAgentSession( challenge: string ) {
        const id = nextSessionId++;
        clientSessions.set( id, { id, challenge, created: new Date() } as ClientAgentSession );
        return id;
    }

    async fetchClientAgentSession( id:number ) {
        return clientSessions.get( id );  
    }

    async updateClientAgentSession( id:number, updates:ClientAgentSessionUpdates ) {
        const session = clientSessions.get( id );
        if( !session )
            throw new Error("Failed to find client session by id: " + id );
        else
            clientSessions.set( id, { ...session, ...updates } );
    }

    //
    // Remote agent sessions - I am client connecting to remote/agent
    //

    async fetchRemoteAgentSession( key: RemoteAgentSessionKey ) {
        return remoteSessions.get( resolveRemoteKey( key ) );
    }

    async updateRemoteAgentSession( key: RemoteAgentSessionKey, update: RemoteAgentSessionUpdate ) {
        remoteSessions.set(
            resolveRemoteKey( key ),
            { ...key, ...update, created: new Date() }
        );
    }

    async deleteRemoteAgentSession( key: RemoteAgentSessionKey ) {
        remoteSessions.delete( resolveRemoteKey( key ) );
    }

    //
    // Agentic Profile Cache
    //

    async cacheAgenticProfile( profile: AgenticProfile ) { 
        profileCache.set( profile.id, profile )
    }

    async getCachedAgenticProfile( did: DID ) {
        return profileCache.get( did )
    }
}

function resolveRemoteKey( key: RemoteAgentSessionKey ) {
    return `${key.uid} ${key.userAgentDid} ${key.peerAgentDid} ${key.peerServiceUrl}`;
}