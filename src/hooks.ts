import {
    DID,
    getWebDidResolver
} from "@agentic-profile/auth";
import { Resolver } from "did-resolver";

import { UserId } from "./storage/models.js";
import { ChatMessage } from "./chat/models.js";
import { ChatCompletionResult } from "./ai-providers/models.js";
import { createAgentDid } from "./accounts/util.js";
import { generateChatReply } from "./chat/full.js";

export interface AgentHooks {
    generateChatReply: ( uid: UserId, agentDid: DID, history: ChatMessage[] ) => Promise<ChatCompletionResult>;
    createAgentDid: ( uid: UserId ) => DID;
    didResolver: Resolver
}

export interface AgentHookOverrides {
    generateChatReply?: ( uid: UserId, agentDid: DID, history: ChatMessage[] ) => Promise<ChatCompletionResult>;
    createAgentDid?: ( uid: UserId ) => DID;
    didResolver?: Resolver
}

const defaultHooks = {
    generateChatReply,
    createAgentDid,
    didResolver: new Resolver( getWebDidResolver() )
};

export function setAgentHooks( hooks: AgentHookOverrides ) {
    const update = { ...defaultHooks, ...hooks };
    (globalThis as any).__hooks = update;
    console.log( 'setAgentHooks', update );
}

export function agentHooks() {
    if( !(globalThis as any).__hooks ) {
        console.error( 'no hooks!' );
        throw new Error('Accessed hooks() before initializing');
    } else
        return (globalThis as any).__hooks as AgentHooks;
}