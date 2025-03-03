console.log( "Chat reply..." );

import axios from "axios";

import { logAxiosResult } from "./util.js";

(async ()=>{
    if( process.argv.length < 3 ) {
        console.log( "Please provide the agent token from the login request, such as:\n    yarn chat-reply 1:ffgf6sdf76sdf76sdf");
        return;
    }
    const agentToken = process.argv[2];
    console.log( "Using agent token: ", agentToken );

    const envelope = {
    	to: 'https://localhost:3003/iam/2',
    	message: {
    		from: 'http://localhost:3003/iam/7',
    		content: "Hello!",
            created: new Date()
    	}
    };

    const auth = {
    	headers: {
    		Authorization: 'Agentic ' + agentToken
    	}
    }

    try {
        const result = await axios.put(
        	"http://localhost:3003/v1/agents/2/agentic-chat",
        	envelope,
        	auth
        );

        logAxiosResult( result );
    } catch (error) {
        logAxiosResult( error );
        console.error("ERROIR: Failed to chat with reply");
    }
})();