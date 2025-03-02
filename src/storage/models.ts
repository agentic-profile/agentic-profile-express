import {
    AgentAuthStore
} from "@agentic-profile/auth";
import {
    AgentChat,
    AgentChatKey,
    ChatMessage,
    ChatMessageHistory
} from "../chat/models.js";

export type UserId = string | number;

export interface User {
    uid: number,
    name: string,
    alias?: string
}

export interface Account extends User {
    credit?: number
}

export interface Storage extends AgentAuthStore {
    fetchAccountFields: ( uid: UserId, fields?: string ) => Promise<Account | undefined>,

    // Chat
    ensureAgentChat: ( key: AgentChatKey, messages?: ChatMessage[] ) => Promise<AgentChat>
    recordChatCost: ( key: AgentChatKey, cost: number | undefined ) => void,
    insertChatMessage: ( key: AgentChatKey, message: ChatMessage ) => void,
    updateChatHistory: ( key: AgentChatKey, history: ChatMessageHistory ) => void,
    fetchAgentChat: ( key: AgentChatKey ) => Promise<AgentChat | undefined>
}
