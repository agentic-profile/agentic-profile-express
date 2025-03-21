console.log( "Chat reply..." );

import axios from "axios";

import { logAxiosResult } from "./util.js";

(async ()=>{
    if( process.argv.length < 3 ) {
        console.log( "Please provide the agent token from the login request, such as:\n    node chat-reply 1:ffgf6sdf76sdf76sdf");
        return;
    }
    const authToken = process.argv[2];
    console.log( "Using agent auth token: ", authToken );

    const envelope = {
    	to: 'did:web:localhost%3A3003:iam:2',
    	message: {
    		from: 'did:web:localhost%3A3003:iam:7#agentic-chat',
    		content: "Hello!",
            created: new Date()
    	}
    };

    const auth = {
    	headers: {
    		Authorization: 'Agentic ' + authToken
    	}
    }

    try {
        const result = await axios.put(
        	"http://localhost:3003/users/2/agent-chats",
        	envelope,
        	auth
        );

        logAxiosResult( result );
    } catch (error) {
        logAxiosResult( error );
        console.error("ERROR: Failed to chat with reply");
    }
})();