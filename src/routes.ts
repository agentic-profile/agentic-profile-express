import express, {
    Response,
    Request
} from "express";
import {
    ChatHooks,
    ChatMessageEnvelope
} from "@agentic-profile/chat";
import {
    agentHooks,
    CommonHooks
} from "@agentic-profile/common";

import {
    asyncHandler,
    baseUrl,
} from "./util/net.js"
import { resolveAgentSession } from "./agentic-auth.js";
import { NewAccountFields } from "./storage/models.js";


export interface Status {
    name?: string,
    version?: number[]
}

export interface OpenRouteOptions {
    status?: Status,
}

export function openRoutes( { status = {} }: OpenRouteOptions ) {
    var router = express.Router();

    // simple status page, also used for server health
    const runningSince = new Date();
    router.get( "/status", function( req: Request, res: Response ) {
        res.json({ name:"Agentic Profile Node Service", version:[1,0,0], ...status, started:runningSince, url:baseUrl(req) }); 
    });

    // TODO remove - only for testing!
    router.get( "/storage", asyncHandler( async (req: Request, res: Response) => {
        const data = await agentHooks<CommonHooks>().storage.dump();
        res.status(200)
            .set('Content-Type', 'application/json')
            .send( JSON.stringify(data, null, 4) ); // make easier to read ;)
    }));

    // TODO remove - only for testing!
    router.post( "/accounts", asyncHandler( async (req: Request, res: Response) => {
        const { storage } = agentHooks<Storage>();
        const account = await storage.createAccount( req.body as NewAccountFields );
        res.json({ account });
    }));

    // For a third-party agent to post a message to the agent of the given uid
    // If no authorization is provided, or it is expired, then a challenge is issued
    // and the /agent-login should be used to get a session key
    router.put( "/users/:uid/agent-chats", asyncHandler( async (req: Request, res: Response) => {
        const { uid } = req.params;

        const agentSession = await resolveAgentSession( req, res );
        if( !agentSession )
            // A 401 has been issued with a challenge, or an auth error has been thrown
            return;

        const result = await agentHooks<ChatHooks>().handleAgentChatMessage({
            uid,
            envelope: req.body as ChatMessageEnvelope, 
            agentSession
        });
        res.json( result );
    }));

    console.log( "Open routes are ready" );
    return router;
}