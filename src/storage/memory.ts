import {
    CanonicalURI,
    ChallengeRecord,
    ClientAgentSession
} from "@agentic-profile/auth";

import {
	Account,
	Storage,
	UserId
} from "./models.js";
import { AgentChatKeys } from "../chat/models.js";
import { ServerError } from "../util/net.js";


const accounts = new Map<string,Account>();

let nextChallengeId = 1;
const challenges = new Map<number,ChallengeRecord>();

let nextSessionId = 1;
const clientSessions = new Map<number,ClientAgentSession>();

export class InMemoryStorage implements Storage {
    async recordChatCost( keys: AgentChatKeys, cost: number | undefined ) {
    	if( !cost )
    		return;	// nothing to do!

    	const { uid /*, canonicalUri*/ } = keys;

    	const account = accounts.get( ''+uid );
    	if( !account )
    		throw new ServerError([4],"Invalid user id while recording chat cost");
    	account.credit = account.credit ? account.credit - cost : -cost;

    	// TODO also record on chat
    }

	async fetchAccountFields( uid: UserId, fields?: string ) {
        return accounts.get( ''+uid );
    }

    async saveClientSession( sessionKey: string, canonicalUri: CanonicalURI, agentUrl?: string ) {
        const id = nextSessionId++;
    	clientSessions.set( id, {
    		id,
    		created: new Date(),
    		canonicalUri,
    		agentUrl,
    		sessionKey
    	});
    	return id;	
    }

    async fetchClientSession( id: number ) {
    	return clientSessions.get( id ); 
    }

    async saveChallenge( challenge: string ) {
    	const id = nextChallengeId++;
    	challenges.set( id, { id, challenge, created: new Date() } );
    	return id;
    }

    async fetchChallenge( id: number ) {
        return challenges.get( id );
    }

    async deleteChallenge( id: number ) {
    	challenges.delete( id );
    }
}
