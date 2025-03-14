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
    const challenge = process.argv[2].trim();
    console.log( "Using challenge: ", challenge );

    // I am 7
    const keyringPath = join(__dirname, "..", "www", "iam", "7", "keyring.json");
    const buffer = await readFile( keyringPath );
    const { privateJwk } = JSON.parse( buffer );
    console.log( "Using private jwk: ", JSON.stringify( privateJwk, null, 4 ) );

    // Authenticating with an agent of user 2 on localhost
    const remoteAgentUrl = "http://localhost:3003/users/2/agentic-chat";
    const agenticChallenge = {
        challenge,
        login: "/agent-login"
    };

    const attestation = {
        agentDid: "did:web:localhost%3A3003:iam:7#agentic-chat",
        verificationId: "did:web:localhost%3A3003:iam:7#agent-key-0" 
    }

    try {
        const jwsSignedChallenge = await signChallenge({ agenticChallenge, attestation, privateJwk });

        // login with remote agent to get session key
        const loginUrl = new URL( agenticChallenge.login, remoteAgentUrl ).toString();
        const axiosResult = await axios.post( loginUrl, { jwsSignedChallenge } );
        logAxiosResult( axiosResult );

        const { authToken } = axiosResult.data;
        console.log( "\nAgent authorization token:", authToken );
    } catch (error) {
        logAxiosResult( error );
    }
})();