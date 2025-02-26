import auth from "basic-auth";
import express, {
    Response,
    Request
} from "express";
import {
    ClientAgentSession,
    SignedChallenge
} from "@agentic-profile/auth";

import {
    agentLogin,
    resolveAgentSession,
} from "./agentic-auth.js";
import {
    asyncHandler,
    baseUrl,
} from "./util/net.js"

import { ChatMessageEnvelope } from "./agent/chat/models.js"
import { UserId } from "./storage/models.js"

export interface Status {
    name?: string,
    version?: number[]
}

export interface OpenRouteOptions {
    status?: Status,
    handleAgentChatMessage: ( uid: UserId, envelope: ChatMessageEnvelope, agentSession: ClientAgentSession ) => void
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

    // For a third-party agent to post a message to the agent of the given uid
    // If no authorization is provided, or it is expired, then a challenge is issued
    // and the /agent-login should be used to get a session key
    router.put( "/agents/:uid/agentic-chat", asyncHandler( async (req: Request, res: Response) => {
        const { uid } = req.params;

        const agentSession = await resolveAgentSession( req, res );
        if( !agentSession )
            // A 401 has been issued with a challenge...
            return;

        const result = await handleAgentChatMessage( uid, req.body as ChatMessageEnvelope, agentSession );
        res.json( result );
    }));

    router.post( "/agent-login", asyncHandler( async (req: Request, res: Response) => {
        const { uid } = req.params;
        const result = await agentLogin( req.body as SignedChallenge );
        res.json( result );
    }));

    console.log( "Open routes are ready" );
    return router;
}