import {
    ProfileURI,
    CanonicalURI
} from "../models.js"

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

export interface AgentChatKeys {
    uid: number | string,       // target agent for uid, always local
    canonicalUri: CanonicalURI  // remote agent we are chatting with (but may be local)    
}

export interface AgentChat extends AgentChatKeys {
    cid: number,
    created: Date,
    updated: Date,
    cost: number,
    aimodel?: string,
    history: ChatMessageHistory
}

export interface AgentChatHistory {
    history: ChatMessageHistory
}

export interface ChatMessageEnvelope {
    to: ProfileURI,
    message?: ChatMessage,
    rewind?: string
}

export interface ChatMessageReplyEnvelope {
    reply: ChatMessage
}