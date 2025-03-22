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
    if( process.argv.length < 4 ) {
        console.log( "Please provide the challenge 'id' and 'random' from the agent service, such as:\n    yarn create-auth-token 1 ffgf6sdf76sdf76sdf");
        return;
    }
    const id = Number(process.argv[2].trim());
    const random = process.argv[3].trim();
    //console.log( "Using challenge: ", challenge );

    // For this demo, I am 7
    const keyringPath = join(__dirname, "..", "www", "iam", "7", "keyring.json");
    const buffer = await readFile( keyringPath );
    const { privateJwk } = JSON.parse( buffer );
    console.log( "Using private jwk: ", JSON.stringify( privateJwk, null, 4 ) );

    // Authenticating with an agent of user 2 on localhost
    const remoteAgentUrl = "http://localhost:3003/users/2/agentic-chat";
    const agenticChallenge = {
        challenge: { id, random }
    };

    const agentDid = "did:web:localhost%3A3003:iam:7#agentic-chat";
    const attestation = {
        agentDid,
        verificationId: "#agent-key-0" 
    }

    const authToken = await signChallenge({ agenticChallenge, attestation, privateJwk });
    console.log( "\nCreated agent authorization token:", authToken );

    const envelope = {
        to: 'did:web:localhost%3A3003:iam:2',
        message: {
            from: agentDid,
            content: "Hello!",
            created: new Date()
        }
    };

    const auth = {
        headers: {
            Authorization: 'Agentic ' + authToken
        }
    }

    try {
        const result = await axios.put(
            "http://localhost:3003/users/2/agent-chats",
            envelope,
            auth
        );

        logAxiosResult( result );
    } catch (error) {
        logAxiosResult( error );
        console.error("ERROR: Failed to chat with reply");
    }
})();