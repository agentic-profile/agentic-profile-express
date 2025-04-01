console.log( "Local Agentic Chat Message..." );

import { prettyJSON } from "@agentic-profile/common";
import { join } from "path";
import { 
    argv,
    sendAgenticPayload
} from "@agentic-profile/express-common";

import { __dirname } from "./util.js";

const ARGV_OPTIONS = {
    id: {
        type: "string",
        short: "i"
    },
    secret: {
        type: "string",
        short: "s"
    }
};

(async ()=>{
    const port = process.env.PORT || 3003;

    // Command line parsing
    const { values } = argv.parseArgs({
        args: process.argv.slice(2),
        options: ARGV_OPTIONS
    });
    const { secret } = values;
    const id = Number( values.id );

    // Create our chat message
    const payload = {
        to: `did:web:example.com#agent-chat`,
        message: {
            from: `did:web:localhost%3A${port}:iam:local-me#agent-chat`,
            content: "Hello!  If you are number 2, then who is number 1?",
            created: new Date()
        }
    };

    // Send the chat message to the agent
    try {
        const response = await sendAgenticPayload({
            challenge: { id, secret },
            method: "PUT",
            payload,
            peerAgentUrl: `http://localhost:${port}/users/2/agent-chats`,
            profileDir: join(__dirname, "..", "www", "iam", "local-me" ),
            type: "chat"
        });
        console.log( "Sent chat message, reply is: ", prettyJSON( response ));
    } catch(err) {
        console.log( "Failed to send chat message", err );
    }
})();