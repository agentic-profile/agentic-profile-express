import {
    Response,
    Request
} from "express";
import {
    AgentAuthStorage,
    AgenticLoginRequest,
    ClientAgentSession,
    createChallenge,
    handleAuthorization,
    handleLogin
} from "@agentic-profile/auth";
import {
    agentHooks,
    CommonHooks
} from "@agentic-profile/common";


function storage() {
    return agentHooks<CommonHooks>().storage as AgentAuthStorage;
}

// returns:
// - agent session
// - null if request handled by 401/challenge
// - or throws an Error
export async function resolveAgentSession( req: Request, res: Response ): Promise<ClientAgentSession | null> {
    const { authorization } = req.headers;
    if( !authorization ) {
        const challenge = await createChallenge( storage() );
        res.status(401)
            .set('Content-Type', 'application/json')
            .send( JSON.stringify(challenge, null, 4) );
        return null;
    } else
        return await handleAuthorization( authorization, storage() );
}

export async function agentLogin( loginRequest: AgenticLoginRequest ) {
    return await handleLogin( loginRequest, storage() );
}