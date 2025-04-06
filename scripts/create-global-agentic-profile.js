import 'dotenv/config';
import os from "os";
import { join } from "path";
import {
    createAgenticProfile,
    prettyJson,
    webDidToUrl
} from "@agentic-profile/common";
import {
    createEdDsaJwk,
    postJson
} from "@agentic-profile/auth";
import {
    saveProfile
} from "@agentic-profile/express-common";


(async ()=>{

    const port = process.env.PORT || 3003;
    const services = [
        {
            subtype: "chat",
            url: `https://agents.matchwise.ai/users/*/agent-chats`
        }
    ];
    const { profile, keyring, b64uPublicKey } = await createAgenticProfile({ services, createJwk: createEdDsaJwk });

    try {
    	// publish profile to web (so did:web:... will resolve)
        let { data } = await postJson(
            "https://testing.agenticprofile.ai/agentic-profile",
            { profile, b64uPublicKey }
        );
        const savedProfile = data.profile;
        const did = savedProfile.id;
        console.log( `Published agentic profile to:

    ${webDidToUrl(did)}

Or via DID at:

    ${did}
`);

        // also save locally for reference
        const dir = join( os.homedir(), ".agentic", "iam", "global-me" );
        await saveProfile({ dir, profile: savedProfile, keyring });

        console.log(`Saved agentic profile to ${dir}

Shhhh! Keyring for testing... ${prettyJson( keyring )}`);

        // create account # 2, which will be the account represented/billed for user/2/agent-chats
        const payload = {
            options: { uid: 2 },        // force to uid=2
            fields: {
                name: "Eric Portman",   // #2 in the Prisoner ;)
                credit: 10              // $10
            }
        };
        const config = {
            headers: {
                Authorization: `Bearer ${process.env.ADMIN_TOKEN}`,
            },
        };
        ({ data } = await postJson(
            `http://localhost:${port}/accounts`,
            payload,
            config
        ));

        console.log( "Created local account uid=2 to act as peer in agentic chat", prettyJson( data ));
    } catch (error) {
        console.error( "Failed to create global profile", error );
    }
})();