import {
    DID,
    ClientAgentSession
} from "@agentic-profile/auth";
import { UserId } from "../storage/models.js";

export interface StartAgentChat {
    profileDid: DID,
    reset?: boolean
}

export interface ChatMessage {
    from: DID,
    content: string,
    created?: Date
}

export interface ChatMessageHistory {
    messages: ChatMessage[]
}

export interface AgentChatKey {
    // server/remote side
    uid: number | string,       // uid that server agent represents (maps to an agentic profile server represents)
    serverAgentDid: DID,

    // client/caller side
    clientAgentDid: DID         // client agent we are chatting with (but may be local)
                                // usually includes a fragment to qualify the exact agent 
}

export interface AgentChat extends AgentChatKey {
    cid: number,
    created: Date,
    updated: Date,
    cost: number,
    aimodel?: string,
    history: ChatMessageHistory
}

export type HandleAgentChatMessageParams = {
    uid: UserId,
    //pathname: string,
    envelope: ChatMessageEnvelope,
    agentSession: ClientAgentSession    
}

export interface ChatMessageEnvelope {
    to: DID,
    message?: ChatMessage,
    rewind?: string
}

export interface ChatMessageReplyEnvelope {
    reply: ChatMessage
}