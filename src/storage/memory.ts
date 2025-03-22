import { ChatMessage } from "@agentic-profile/common";
import {
    ClientAgentSession,
    ClientAgentSessionUpdates,
} from "@agentic-profile/auth";
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
} from "./models.js";
import { ServerError } from "../util/net.js";

let nextUserId = 1;
const accounts = new Map<string,Account>();

let nextSessionId = 1;
const clientSessions = new Map<number,ClientAgentSession>();

const agentChats = new Map<string,AgentChat>();

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
            agentChats: mapToObject( agentChats )
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

    async fetchAgentChat( key: AgentChatKey ) {
        return agentChats.get( resolveKey( key ) );    
    }


    //
    // Accounts
    //

    async createAccount( fields: NewAccountFields ) {
        let uid;
        if( fields.uid ) {
            uid = +fields.uid;
            if( accounts.has( ''+uid ) )
                throw new ServerError([4],"Account id is already in use: " + uid); 
            if( uid >= nextUserId )
                nextUserId = uid + 1;
        } else
            uid = nextUserId++;

        const { name, credit = 2 } = fields;
        const account = { name, credit, uid, created: new Date() };
        accounts.set( ''+uid, account );
        console.log( 'createAccount', account, accounts );
        return account;
    }

    async fetchAccountFields( uid: UserId, fields?: string ) {
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
    // Sessions
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
}
