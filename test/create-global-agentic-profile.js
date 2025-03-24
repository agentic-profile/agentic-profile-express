import axios from "axios";
import { webDidToUrl } from "@agentic-profile/common";

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

    // I am user 6
    const uid = 6;
    const { profile, jwk } = await createAgenticProfile( `https://matchwise.ai/users/${uid}/agent-chats` );
    const { b64uPublicKey } = jwk;

    try {
    	// publish profile to web (so did:web:... will resolve)
        const axiosResult = await axios.post(
        	"https://test-api.agenticprofile.ai/agentic-profile",
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
        const dir = join(__dirname, "..", "www", "iam", ''+uid );
        await mkdir(dir, { recursive: true });

        const didPath = join(dir, "did.json");
        await writeFile(
            didPath,
            JSON.stringify(savedProfile, null, 4),
            "utf8"
        );

        const keyringJSON = JSON.stringify(jwk, null, 4);
        await writeFile(
            join(dir, "keyring.json"),
            keyringJSON,
            "utf8"
        );

        console.log(`Shhhh! Keyring for testing... ${keyringJSON}`);

        // create account # 2, which will be the person represented by users/2/agent-chats
        const newAccountFields = {
            uid: 2,
            name: "Eric Portman", // #2 in the Prisoner ;)
            credit: 10
        };

        const { data: data2 } = await axios.post( `http://localhost:${port}/accounts`, newAccountFields );
        console.log( "\nCreated local account uid=2 to act as peer in agentic chat", prettyJSON( data2 ));
    } catch (error) {
        logAxiosResult( error );
    }
})();