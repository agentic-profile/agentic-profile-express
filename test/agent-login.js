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

(async ()=>{
    if( process.argv.length < 3 ) {
        console.log( "Please provide the challenge from the agent service, such as:\n    yarn agent-login 1:ffgf6sdf76sdf76sdf");
        return;
    }
    const challenge = process.argv[2];
    console.log( "Using challenge: ", challenge );

    const keyringPath = join(__dirname, "..", "www", "iam", "1", "keyring.json");
    const buffer = await readFile( keyringPath );
    const keyring = JSON.parse( buffer );
    const keypair = keyring[0];
    console.log( "Using keypair: ", JSON.stringify( keypair, null, 4 ) );

    const remoteAgentUrl = "http://localhost:3003/agents/1/agentic-chat";
    const agenticChallenge = {
        challenge,
        login: "/v1/agent-login"
    };

    const attestation = {
        canonicalUri: "http://localhost:3003/iam/1"   
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
        console.error("Failed to login");
        logAxiosResult( error );
    }
})();