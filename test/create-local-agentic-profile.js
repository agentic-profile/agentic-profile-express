console.log( "Creating Local Agentic Profile and Peer Account...")

import 'dotenv/config';
import axios from "axios";
import { join } from "path";

import {
    __dirname,
    createAgenticProfile,
    logAxiosResult,
    prettyJSON,
    saveProfile
} from "./util.js";


(async ()=>{

    const port = process.env.PORT || 3003;

    const uid = 6;
    const { profile, jwk } = await createAgenticProfile( `http://localhost:${port}/users/${uid}/agent-chats` );

    const did = `did:web:localhost%3A${port}:iam:${uid}`;
    profile.id = did;

    try {
        const dir = join(__dirname, "..", "www", "iam", ''+uid);
        const { profilePath } = await saveProfile({ dir, profile, keyring: [jwk] });

        console.log(`
Agentic Profile saved to ${profilePath}

With server running, view at http://localhost:${port}/iam/${uid}/did.json or via DID at ${did}

Shhhh! Keyring for testing... ${prettyJSON([jwk])}
`);

        // create account # 2, which will be the person represented by agent/2
        const params = {
            options: { uid: 2 },    // force to uid=2
            fields: {
                name: "Eric Portman", // #2 in the Prisoner ;)
                credit: 10
            }
        };
        const config = {
            headers: {
                Authorization: `Bearer ${process.env.ADMIN_TOKEN}`
            }
        }
        const { data } = await axios.post( `http://localhost:${port}/accounts`, params, config );
        console.log( "Created local account uid=2 to act as peer in agentic chat", prettyJSON( data ));
    } catch (error) {
        logAxiosResult( error );
    }
})();
