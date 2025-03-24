console.log( "Creating Local Agentic Profile and Peer Account...")

import axios from "axios";

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { writeFile, mkdir } from "fs/promises";

import {
    createAgenticProfile,
    logAxiosResult,
    prettyJSON
} from "./util.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


(async ()=>{

    const port = process.env.PORT || 3003;

    const uid = 6;
    const { profile, jwk } = await createAgenticProfile( `http://localhost:${port}/users/${uid}/agent-chats` );

    const did = `did:web:localhost%3A${port}:iam:${uid}`;
    profile.id = did;

    try {
        const dir = join(__dirname, "..", "www", "iam", ''+uid);
        await mkdir(dir, { recursive: true });

        const didPath = join(dir, "did.json");
        await writeFile(
            didPath,
            prettyJSON(profile),
            "utf8"
        );

        const keyringJSON = prettyJSON(jwk);
        await writeFile(
            join(dir, "keyring.json"),
            keyringJSON,
            "utf8"
        );

        console.log(`

Agentic Profile saved to ${didPath}

With server running, view at http://localhost:${port}/iam/${uid}/did.json or via DID at ${did}

Shhhh! Keyring for testing... ${keyringJSON}
`);

        // create account # 2, which will be the person represented by agent/2
        const newAccountFields = {
            uid: 2,
            name: "Eric Portman", // #2 in the Prisoner ;)
            credit: 10
        };
        const { data } = await axios.post( `http://localhost:${port}/accounts`, newAccountFields );
        console.log( "Created local account uid=2 to act as peer in agentic chat", prettyJSON( data ));
    } catch (error) {
        logAxiosResult( error );
    }
})();
