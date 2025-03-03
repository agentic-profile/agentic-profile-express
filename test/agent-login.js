console.log( "Agent login..." );

import axios from "axios";
import {
    signChallenge
} from "@agentic-profile/auth";

import { logAxiosResult } from "./util.js";

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFile } from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function loadJSON( filename ) {
    const path = join(__dirname, filename );
    const buffer = await readFile( path );
    return JSON.parse( buffer );    
}

// Find a valid keypair for the given agent
function findKeypair( agent, keyring ) {
    for( const keypair of agent.keyring ) {
        const found = keyring.find(e=>e.publicKey === keypair.publicKey );
        if( found )
            return found;
    }
}

(async ()=>{
    if( process.argv.length < 3 ) {
        console.log( "Please provide the challenge from the agent service, such as:\n    yarn agent-login 1:ffgf6sdf76sdf76sdf");
        return;
    }
    const challenge = process.argv[2];
    console.log( "Using challenge: ", challenge );

    // for the chat agent of the given agentic profile (7), find a valid keypair to authenticate with
    const profile = await loadJSON( "../www/iam/7/index.json" );
    const agent = profile.agents.find(e=>e.type === 'chat');
    const keyring = await loadJSON( "../www/iam/7/keyring.json" );
    const keypair = findKeypair( agent, keyring );
    console.log( "Using agent and keypair: ", JSON.stringify({ agent, keyring, keypair}, null, 4 ) );

    const remoteAgentUrl = "http://localhost:3003/agents/1/agentic-chat";
    const agenticChallenge = {
        challenge,
        login: "/v1/agent-login"
    };

    const attestation = {
        canonicalUri: "http://localhost:3003/iam/7",
        agentUrl: agent.url   
    }

    try {
        const signedChallenge = await signChallenge({ agenticChallenge, keypair, attestation });

        // login with remote agent to get session key
        const loginUrl = new URL( agenticChallenge.login, remoteAgentUrl ).toString();
        const axiosResult = await axios.post( loginUrl, signedChallenge );
        logAxiosResult( axiosResult );

        const { agentToken } = axiosResult.data;
        console.log( "Agent token:", agentToken );
    } catch (error) {
        console.error("Failed to login",error.message);
        logAxiosResult( error );
    }
})();