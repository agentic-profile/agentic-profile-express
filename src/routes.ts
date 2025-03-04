import express, {
    Response,
    Request
} from "express";
import { SignedChallenge } from "@agentic-profile/auth";

import {
    agentLogin,
    resolveAgentSession,
} from "./agentic-auth.js";
import {
    asyncHandler,
    baseUrl,
} from "./util/net.js"
import {
    ChatMessageEnvelope,
    HandleAgentChatMessageParams
} from "./chat/models.js";
import { createAccount } from "./accounts/management.js";
import { NewAccountFields } from "./storage/models.js";
import { storage } from "./storage/handle.js";

export interface Status {
    name?: string,
    version?: number[]
}

export interface OpenRouteOptions {
    status?: Status,
    handleAgentChatMessage: ( params: HandleAgentChatMessageParams ) => void
}

export function openRoutes( options: OpenRouteOptions ) {
    const {
        status = {},
        handleAgentChatMessage
    } = options;

    var router = express.Router();

    // simple status page, also used for server health
    const runningSince = new Date();
    router.get( "/status", function( req: Request, res: Response ) {
        res.json({ name:"Agentic Profile Node Service", version:[1,0,0], ...status, started:runningSince, url:baseUrl(req) }); 
    });

    router.get( "/storage", asyncHandler( async (req: Request, res: Response) => {
        const data = await storage().dump();
        res.status(200)
            .set('Content-Type', 'application/json')
            .send( JSON.stringify(data, null, 4) ); // make easier to read ;)
    }));

    // TODO lock this down - only for testing!
    router.post( "/accounts", asyncHandler( async (req: Request, res: Response) => {
        const account = await createAccount( req.body as NewAccountFields );
        res.json({ account });
    }));

    // For a third-party agent to post a message to the agent of the given uid
    // If no authorization is provided, or it is expired, then a challenge is issued
    // and the /agent-login should be used to get a session key
    router.put( "/agents/:uid/agentic-chat", asyncHandler( async (req: Request, res: Response) => {
        const { uid } = req.params;

        const agentSession = await resolveAgentSession( req, res );
        if( !agentSession )
            // A 401 has been issued with a challenge...
            return;

        const result = await handleAgentChatMessage({
            uid,
            pathname: req.path,
            envelope: req.body as ChatMessageEnvelope, 
            agentSession
        });
        res.json( result );
    }));

    router.post( "/agent-login", asyncHandler( async (req: Request, res: Response) => {
        const result = await agentLogin( req.body as SignedChallenge );
        res.json( result );
    }));

    console.log( "Open routes are ready" );
    return router;
}