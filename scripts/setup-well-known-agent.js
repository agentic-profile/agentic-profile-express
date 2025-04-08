import 'dotenv/config';

import { join } from "path";
import { createEdDsaJwk } from "@agentic-profile/auth";
import {
    createAgenticProfile,
    webDidToUrl
} from "@agentic-profile/common";
import { saveProfile } from "@agentic-profile/express-common";
import { __dirname } from "./util.js";


(async ()=>{

	const services = [
        {
            subtype: "presence",
            url: `https://${process.env.AP_HOSTNAME}/presence`
        }
    ];
    const { profile, keyring } = await createAgenticProfile({
        services,
        createJwk: createEdDsaJwk 
    });
    const did = `did:web:${process.env.AP_HOSTNAME}`;
    profile.id = did;

    console.log( `Published agentic profile to:

    ${webDidToUrl(did)}

Or via DID at:

    ${did}
`);

    try {
        // also save locally as "beta" for testing
        let dir = join( __dirname, "..", "www", ".well-known" );
        await saveProfile({ dir, profile });

        dir = join( __dirname, ".." );
        await saveProfile({ dir, keyring });
    } catch(error) {
    	console.log( "Failed to save profile", error );
    }
})();