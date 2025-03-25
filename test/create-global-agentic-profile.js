import axios from "axios";
import { webDidToUrl } from "@agentic-profile/common";

import os from "os";
import { join } from "path";

import {
    createAgenticProfile,
    logAxiosResult,
    prettyJSON,
    saveProfile
} from "./util.js";


(async ()=>{

    const port = process.env.PORT || 3003;

    // I am user 6
    const uid = 6;
    const { profile, jwk } = await createAgenticProfile( `https://matchwise.ai/users/${uid}/agent-chats` );
    const { b64uPublicKey } = jwk;

    try {
    	// publish profile to web (so did:web:... will resolve)
        const axiosResult = await axios.post(
        	"https://testing.agenticprofile.ai/agentic-profile",
        	{ profile, b64uPublicKey }
        );
        const data = axiosResult.data ?? axiosResult.response?.data;
        const savedProfile = data.profile;
        const did = savedProfile.id;
        console.log( `Published agentic profile to:

    ${webDidToUrl(did)}

Or via DID at:

    ${did}
`);

        // also save locally for reference
        const dir = join( os.homedir(), ".agentic", "iam", ''+uid );
        await saveProfile({ dir, profile: savedProfile, keyring: [jwk] });

        console.log(`Shhhh! Keyring for testing... ${prettyJSON([jwk])}`);

        // create account # 2, which will be the person represented by users/2/agent-chats
        const params = {
            options: { uid: 2 },    // force to uid=2
            fields: {
                name: "Eric Portman", // #2 in the Prisoner ;)
                credit: 10
            }
        };
        const { data: data2 } = await axios.post( `http://localhost:${port}/accounts`, params );
        console.log( "\nCreated local account uid=2 to act as peer in agentic chat", prettyJSON( data2 ));
    } catch (error) {
        logAxiosResult( error );
    }
})();