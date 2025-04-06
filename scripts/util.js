import { join } from "path";
import os from "os";
import {
    loadKeyring,
    loadProfile,
    loadProfileAndKeyring
} from "@agentic-profile/express-common";
import { 
    removeFragmentId
} from "@agentic-profile/common";

import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

export async function createProfileResolver() {
    // "regular" user
    const myProfileAndKeyring = await loadProfileAndKeyring( join( os.homedir(), ".agentic", "iam", "global-me" ) );

    // system account, to handle #system-key verifications from users
    const profile = await loadProfile( join( __dirname, "..", "www", ".well-known" ) );
    const keyring = await loadKeyring( join( __dirname, ".." ) ); 

    const profiles = [ myProfileAndKeyring, { profile, keyring }]; 
    console.log( "profiles", profiles );

    const profileResolver = async ( did ) => {
        const targetId = removeFragmentId( did );
        const found = profiles.find( e=>e.profile.id === targetId );
        console.log( "profileResolver", did, targetId, found );
        return found;
    };

    return { profileResolver, myProfileAndKeyring };
}
