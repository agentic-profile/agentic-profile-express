import 'dotenv/config';
import { join } from "path";
import {
    prettyJSON,
    webDidToUrl
} from "@agentic-profile/common";
import {
    createAgenticProfile,
    fetchJson,
    saveProfile
} from "@agentic-profile/express-common";

import { __dirname } from "./util.js";


(async ()=>{

    const port = process.env.PORT || 3003;
    const uid = 6;
    const services = [
        {
            type: "chat",
            url: `http://localhost:${port}/users/${uid}/agent-chats`
        }
    ];
    const { profile, keyring } = await createAgenticProfile({ services });

    // simple localhost DID
    const did = `did:web:localhost%3A${port}:iam:local-me`;
    profile.id = did;

    try {
        const dir = join( __dirname, "..", "www", "iam", "local-me" );
        const { profilePath } = await saveProfile({ dir, profile, keyring });

        console.log(`
Agentic Profile saved to ${profilePath}

With server running, view at ${webDidToUrl(did)} or via DID at ${did}

Shhhh! Keyring for testing... ${prettyJSON(keyring)}
`);

        // create account # 2, which will be the person represented/billed by users/2/agent-chat
        const payload = {
            options: { uid: 2 },    // force to uid=2
            fields: {
                name: "Eric Portman", // #2 in the Prisoner ;)
                credit: 10
            }
        };
        const config = {
            headers: {
                Authorization: `Bearer ${process.env.ADMIN_TOKEN}`,
            },
        }
        const { data } = await fetchJson(
            `http://localhost:${port}/accounts`,
            payload,
            config
        );

        console.log( "Created local account uid=2 to act as peer in agentic chat", prettyJSON( data ));
    } catch (error) {
        console.error( "Failed to create profile: " + error );
    }
})();
