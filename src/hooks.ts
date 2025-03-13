import { DID } from "@agentic-profile/auth";

import { UserId } from "./storage/models.js";
import { ChatMessage } from "./chat/models.js";
import { ChatCompletionResult } from "./ai-providers/models.js";
import { createAgentDid } from "./accounts/util.js";
import { generateChatReply } from "./chat/full.js";

export interface AgentHooks {
    generateChatReply: ( uid: UserId, history: ChatMessage[] ) => Promise<ChatCompletionResult>;
    createAgentDid: ( uid: UserId ) => DID;
}

const defaultHooks = {
    generateChatReply,
    createAgentDid
};

export function setAgentHooks( hooks: AgentHooks ) {
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