console.log( "Global Agentic Chat Message..." );

import { join } from "path";
import os from "os";
import { sendChatMessage} from "./util.js";

(async ()=>{
    const port = process.env.PORT || 3003;

    await sendChatMessage({
        argv: process.argv,
        profileDir: join( os.homedir(), ".agentic", "iam", "6" ),
        peerAgentDid: `did:web:localhost%3A${port}:iam:2#agent-chat`,
        peerAgentUrl: `http://localhost:${port}/users/2/agent-chats`
    });
})();