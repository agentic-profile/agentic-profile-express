import {
    DID,
    ClientAgentSession
} from "@agentic-profile/auth";
import { UserId } from "../storage/models.js";

export interface StartAgentChat {
    userAgentDid: DID,    // MAY also specify agent as did:web:example.com/dave#agent-7
    peerAgentDid: DID,
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
    userAgentDid: DID,

    // client/caller side
    peerAgentDid: DID           // client/peer agent we are chatting with (but may be local)
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
    envelope: ChatMessageEnvelope,
    agentSession: ClientAgentSession    
}

export interface ChatMessageEnvelope {
    to: DID,
    message: ChatMessage,
    rewind?: string
}

export interface ChatMessageReplyEnvelope {
    reply: ChatMessage
}