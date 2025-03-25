console.log( "Global Agentic Chat Message..." );

import { join } from "path";
import os from "os";
import { sendChatMessage } from "./util.js";

(async ()=>{
    await sendChatMessage({
        argv: process.argv,
        profileDir: join( os.homedir(), ".agentic", "iam", "6" ),
        peerAgentDid: `did:web:example.com:2#agent-chat`,	// becomes "to" in chat message
        peerAgentUrl: `https://agents.smarterdating.ai/users/2/agent-chats`
    });
})();