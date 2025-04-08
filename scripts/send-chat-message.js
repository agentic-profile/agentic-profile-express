import os from "os";
import { join } from "path";
import { prettyJson } from "@agentic-profile/common";
import {
    generateAuthToken,
    sendAgenticPayload,
} from "@agentic-profile/auth";
import { argv } from "@agentic-profile/express-common";
import { createProfileResolver } from "./util.js";

const ARGV_OPTIONS = {
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
    const {
        peerAgentUrl = `http://localhost:${port}/users/2/agent-chats`
    } = values;

    try {
        const { profileResolver, myProfileAndKeyring } = await createProfileResolver();
        const agentDid = myProfileAndKeyring.profile.id + "#agent-chat";

        // create message
        const payload = {
            to: `did:web:example.com#agent-chat`,
            message: {
                from: agentDid,
                content: "Hello!  If you are number 2, then who is number 1?",
                created: new Date()
            }
        };

        const { data } = await sendAgenticPayload({ 
            url: peerAgentUrl, 
            payload,
            resolveAuthToken: async ( agenticChallenge ) => {
                return generateAuthToken({
                    agentDid,
                    agenticChallenge,
                    profileResolver
                })
            }
        });
        console.log( "Sent chat message, reply is: ", prettyJson( data ));
    } catch(err) {
        console.log( "Failed to send chat message", err );
    }
})();