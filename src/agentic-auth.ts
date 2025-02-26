import {
    Response,
    Request
} from "express";
import {
    SignedChallenge,
    ClientAgentSession,
    createChallenge,
    handleAuthorization,
    handleLogin
} from "@agentic-profile/auth";

import { storage } from "./storage/handle.js";

// returns:
// - agent session
// - null if request handled by 401/challenge
// - or throws an Error
export async function resolveAgentSession( req: Request, res: Response ): Promise<ClientAgentSession | null> {
    const { authorization } = req.headers;
    if( !authorization ) {
        const challenge = await createChallenge( storage() );
        res.status(401).send( challenge );
        return null;
    } else
        return await handleAuthorization( authorization, storage() );
}

export async function agentLogin( signedChallenge: SignedChallenge ) {
    return await handleLogin( signedChallenge, storage() );
}