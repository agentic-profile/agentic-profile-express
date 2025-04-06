import { ClientAgentSessionStorage } from "@agentic-profile/auth";
import { ChatMessage, UserID } from "@agentic-profile/common";
import {
    AgentChat,
    AgentChatKey,
    ChatMessageHistory,
    ChatStorage
} from "@agentic-profile/chat";


export interface User {
    uid: UserID,
    name: string,
    created: Date
}

export interface Account extends User {
    credit?: number
}

export interface CreateAccountOptions {
    uid?: UserID
}

export interface CreateAccountFields {
    name: string,
    credit?: number
}

export interface CreateAccount {
    options: CreateAccountOptions,
    fields: CreateAccountFields
}

export interface Storage extends ClientAgentSessionStorage, ChatStorage {
    // Accounts
    createAccount: ( account: CreateAccount ) => Promise<Account>,
    fetchAccountFields: ( uid: UserID, fields?: string ) => Promise<Account | undefined>,

    // Chat
    ensureAgentChat: ( key: AgentChatKey, messages?: ChatMessage[] ) => Promise<AgentChat>
    recordChatCost: ( key: AgentChatKey, cost: number | undefined ) => void,
    insertChatMessage: ( key: AgentChatKey, message: ChatMessage, ignoreFailure?: boolean ) => void,
    updateChatHistory: ( key: AgentChatKey, history: ChatMessageHistory ) => void,
    fetchAgentChat: ( key: AgentChatKey ) => Promise<AgentChat | undefined>,

    // Debug (optional)
    dump: () => Promise<any>
}
