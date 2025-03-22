import { ClientAgentSessionStorage } from "@agentic-profile/auth";
import { ChatMessage } from "@agentic-profile/common";
import {
    AgentChat,
    AgentChatKey,
    ChatMessageHistory,
    ChatStorage
} from "@agentic-profile/chat";

export type UserId = string | number;

export interface User {
    uid: UserId,
    name: string,
    created: Date
}

export interface NewAccountFields {
    uid: UserId,
    name: string,
    credit?: number
}

export interface Account extends User {
    credit?: number
}

export interface Storage extends ClientAgentSessionStorage, ChatStorage {
    // Accounts
    createAccount: ( account: NewAccountFields ) => Promise<Account>,
    fetchAccountFields: ( uid: UserId, fields?: string ) => Promise<Account | undefined>,

    // Chat
    ensureAgentChat: ( key: AgentChatKey, messages?: ChatMessage[] ) => Promise<AgentChat>
    recordChatCost: ( key: AgentChatKey, cost: number | undefined ) => void,
    insertChatMessage: ( key: AgentChatKey, message: ChatMessage, ignoreFailure?: boolean ) => void,
    updateChatHistory: ( key: AgentChatKey, history: ChatMessageHistory ) => void,
    fetchAgentChat: ( key: AgentChatKey ) => Promise<AgentChat | undefined>,

    // Debug (optional)
    dump: () => Promise<any>
}
