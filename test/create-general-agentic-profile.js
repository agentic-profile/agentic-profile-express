import {
    createKeypair
} from "@agentic-profile/auth";

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { writeFile, mkdir } from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

(async ()=>{
    const keypair = await createKeypair();
    const publicKeypair = {
        ...keypair,
        privateKey: undefined,
        created: new Date(),
        expires: new Date('2030-1-1')
    };

    const profile = {
        name: "General",
        keyring: [ publicKeypair ],
    };

    try {
        const filePath = join(__dirname, "..", "www", "iam", "7");
        await mkdir(filePath, { recursive: true });

        await writeFile(
            join(filePath, "index.json"),
            JSON.stringify(profile, null, 4),
            "utf8"
        );

        const keyringJSON = JSON.stringify([ keypair ], null, 4);
        await writeFile(
            join(filePath, "keyring.json"),
            keyringJSON,
            "utf8"
        );

        console.log(`Agentic Profile saved to ${join(filePath, "index.json")}
With server running, view at http://localhost:3003/iam/1
Shhhh! Keyring for testing... ${keyringJSON}`);
    } catch (error) {
        console.error("Failed to create profile:", error);
    }
})();
