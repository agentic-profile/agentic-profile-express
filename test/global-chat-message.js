import os from "os";
import { prettyJSON } from "@agentic-profile/common";
import { join } from "path";
import { 
    argv,
    loadProfileAndKeyring,
    signAndSendPayload
} from "@agentic-profile/express-common";

const ARGV_OPTIONS = {
    id: {
        type: "string",
        short: "i"
    },
    secret: {
        type: "string",
        short: "s"
    },
    peerAgentUrl: {
        type: "string",
        short: "a"
    }
};

(async ()=>{
    const port = process.env.PORT || 3003;

    // command line parsing
    const { values } = argv.parseArgs({
        args: process.argv.slice(2),
        options: ARGV_OPTIONS
    });
    const { secret, peerAgentUrl } = values;
    const id = Number( values.id );

    const profileDir = join( os.homedir(), ".agentic", "iam", "global-me" );
    const { profile, keyring } = await loadProfileAndKeyring( profileDir );
    const agentDid = `${profile.id}#agent-chat`;

    // create message
    const payload = {
        to: `did:web:example.com#agent-chat`,
        message: {
            from: agentDid,
            content: "Hello!  If you are number 2, then who is number 1?",
            created: new Date()
        }
    };

    // Send the chat message to the agent
    try {
        const response = await signAndSendPayload({
            agentDid,
            challenge: { id, secret },
            keyring,
            method: "PUT",
            payload,
            profile,
            url: peerAgentUrl ?? `http://localhost:${port}/users/2/agent-chats`
        });
        console.log( "Sent chat message, reply is: ", prettyJSON( response ));
    } catch(err) {
        console.log( "Failed to send chat message", err );
    }
})();