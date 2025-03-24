console.log( "Local Agentic Chat Message..." );

import { sendChatMessage } from "./util.js";

(async ()=>{
    const port = process.env.PORT || 3003;

    await sendChatMessage({
        argv: process.argv,
        iamId: 6,
        peerAgentDid: `did:web:localhost%3A${port}:iam:2#agent-chat`,
        peerAgentUrl: `http://localhost:${port}/users/2/agent-chats`
    });
})();