import axios from "axios";

import {
    createEdDsaJwk
} from "@agentic-profile/auth";

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { writeFile, mkdir } from "fs/promises";

import { logAxiosResult } from "./util.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateKeys( name ) {
    const keypair = await createEdDsaJwk();
    const shared = {
        name,
        ...keypair,
        privateKey: undefined,
        created: new Date(),
        expires: new Date('2030-1-1')
    };
    return { keypair, shared };
}

(async ()=>{

    const did = "did:web:localhost%3A3003:iam:7";
    const jwk = await createEdDsaJwk();
    const verificationMethod = {
        id: did + "#agent-key-0",
        type: "JsonWebKey2020",
        publicKeyJwk: jwk.publicJwk
    };

    const profile = {
        "@context": [
            "https://www.w3.org/ns/did/v1",
            "https://w3id.org/security/suites/jws-2020/v1",
            "https://iamagentic.org/ns/agentic-profile/v1"
        ],
        id: did,
        name: "Dave",
        verificationMethod: [],
        service:[
            {
                id: did + "#agentic-chat",
                type: "AgenticChat",
                serviceEndpoint: "https://localhost:3003/users/7/agent-chat",
                capabilityInvocation: [
                    verificationMethod
                ]
            }
        ]
    };

    try {
        const dir = join(__dirname, "..", "www", "iam", "7");
        await mkdir(dir, { recursive: true });

        const didPath = join(dir, "did.json");
        await writeFile(
            didPath,
            JSON.stringify(profile, null, 4),
            "utf8"
        );

        const keyringJSON = JSON.stringify(jwk, null, 4);
        await writeFile(
            join(dir, "keyring.json"),
            keyringJSON,
            "utf8"
        );

        console.log(`Agentic Profile saved to ${didPath}
With server running, view at http://localhost:3003/iam/7/did.json or via DID at did:web:localhost%3A3003:iam:7
Shhhh! Keyring for testing... ${keyringJSON}`);

        // create account # 2, which will be the person represented by agent/2
        const newAccountFields = {
            uid: 2,
            name: "Eric Portman", // #2 in the Prisoner ;)
            credit: 10
        };

        try {
            const axiosResult = await axios.post( "http://localhost:3003/accounts", newAccountFields );
            logAxiosResult( axiosResult );
        } catch( error ) {
            logAxiosResult( error );    
            console.error( "ERROR: Failed to create account" );
        }

    } catch (error) {
        console.error("ERROR: Failed to create profile:", error);
    }
})();
