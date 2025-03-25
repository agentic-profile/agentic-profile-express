import { createEdDsaJwk } from "@agentic-profile/auth";
import axios from "axios";
import { signChallenge } from "@agentic-profile/auth";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFile, mkdir, writeFile } from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);


export function logAxiosResult( axiosResult ) {
    const { config, status } = axiosResult;
    const data = axiosResult.data ?? axiosResult.response?.data;
    const { method, url } = config ?? {};

    const request = { method, url, headers: config?.headers, data: config?.data, };
    const response = { status, data };

    console.log( "HTTP summary:", prettyJSON({ request, response }) );
}

export function prettyJSON(obj) {
    return JSON.stringify(obj,null,4);
}

export async function createAgenticProfile( serviceEndpoint ) {
    const jwk = await createEdDsaJwk();
    const verificationMethod = {
        id: "#agent-chat-key-0",
        type: "JsonWebKey2020",
        publicKeyJwk: jwk.publicJwk
    };

    const profile = {
        "@context": [
            "https://www.w3.org/ns/did/v1",
            "https://w3id.org/security/suites/jws-2020/v1",
            "https://iamagentic.org/ns/agentic-profile/v1"
        ],
        //id: did,
        name: "Leo",
        verificationMethod: [],
        service:[
            {
                id: "#agent-chat",
                type: "Agentic/Chat",
                serviceEndpoint, // : "https://localhost:3003/users/6/agent-chats",
                capabilityInvocation: [
                    verificationMethod
                ]
            }
        ]
    };

    return { profile, jwk };
}

export async function sendChatMessage({
    argv,
    profileDir,
    peerAgentDid,   // `did:web:localhost%3A${port}:iam:2#agent-chat`
    peerAgentUrl    // `http://localhost:${port}/users/2/agent-chats`
}) {
    console.log('argv',argv);

    if( argv.length < 4 ) {
        console.log( "Please provide the challenge 'id' and 'random' from the agent service, such as:\n    yarn create-auth-token 1 ffgf6sdf76sdf76sdf");
        return;
    }
    const id = Number(argv[2].trim());
    const random = argv[3].trim();

    //const profileDir = join(__dirname, "..", "www", "iam", ''+iamId );
    const { profile, keyring } = await loadProfile( profileDir );
    const { privateJwk } = keyring[0];

    // Authenticating with an agent of user 2 on localhost
    const agenticChallenge = {
        challenge: { id, random }
    };

    const agentDid = `${profile.id}#agent-chat`;
    const attestation = {
        agentDid,
        verificationId: "#agent-chat-key-0" 
    }

    const authToken = await signChallenge({ agenticChallenge, attestation, privateJwk });
    console.log( "\nCreated agent authorization token:", authToken );

    const envelope = {
        to: peerAgentDid,
        message: {
            from: agentDid,
            content: "Hello!  If you are number 2, then who is number 1?",
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
            peerAgentUrl,
            envelope,
            auth
        );

        logAxiosResult( result );
        console.log( "Chat success!" );
    } catch (error) {
        logAxiosResult( error );
        console.error("ERROR: Failed to chat with reply");
    }   
}

export async function saveProfile({ dir, profile, keyring }) {
    await mkdir(dir, { recursive: true });

    const profilePath = join(dir, "did.json");
    await writeFile(
        profilePath,
        prettyJSON( profile ),
        "utf8"
    );

    const keyringPath = join(dir, "keyring.json");
    await writeFile(
        keyringPath,
        prettyJSON( keyring ),
        "utf8"
    );  

    return { profilePath, keyringPath }
}

export async function loadProfile( dir ) {
    let buffer = await readFile( join( dir, "did.json") );
    const profile = JSON.parse( buffer );

    buffer = await readFile( join( dir, "keyring.json") );
    const keyring = JSON.parse( buffer );

    return { profile, keyring };
}