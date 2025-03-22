import {
    Response,
    Request
} from "express";
import {
    ClientAgentSession,
    ClientAgentSessionStorage,
    createChallenge,
    handleAuthorization,
} from "@agentic-profile/auth";
import {
    agentHooks,
    CommonHooks
} from "@agentic-profile/common";


function storage() {
    return agentHooks<CommonHooks>().storage as ClientAgentSessionStorage;
}

// returns:
// - agent session
// - null if request handled by 401/challenge
// - or throws an Error
export async function resolveAgentSession( req: Request, res: Response ): Promise<ClientAgentSession | null> {
    const { authorization } = req.headers;
    if( authorization )
        return await handleAuthorization( authorization, storage() );

    const challenge = await createChallenge( storage() );
    res.status(401)
        .set('Content-Type', 'application/json')
        .send( JSON.stringify(challenge, null, 4) );
    return null;  
}
