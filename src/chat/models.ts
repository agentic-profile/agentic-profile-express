import {
    ProfileURI,
    CanonicalURI,
    ClientAgentSession
} from "@agentic-profile/auth";
import {
    UserId
} from "../storage/models.js";

export interface StartAgentChat {
    profileUri: ProfileURI,
    reset?: boolean
}

export interface ChatMessage {
    from: CanonicalURI,
    content: string,
    created?: Date
}

export interface ChatMessageHistory {
    messages: ChatMessage[]
}

export interface AgentChatKey {
    // server/remote side
    uid: number | string,       // uid that server agent represents (maps to an agentic profile server represents)
    pathname: string,           // path of server agent; allows multiple agents for each uid

    // client/caller side
    canonicalUri: CanonicalURI  // client agent we are chatting with (but may be local)
    clientAgentUrl?: string     // the clients agent that signed the challenge, if undefined then a "general" chat 
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
    pathname: string,
    envelope: ChatMessageEnvelope,
    agentSession: ClientAgentSession    
}

export interface ChatMessageEnvelope {
    to: ProfileURI,
    message?: ChatMessage,
    rewind?: string
}

export interface ChatMessageReplyEnvelope {
    reply: ChatMessage
}