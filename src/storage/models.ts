import { AgentAuthStore } from "@agentic-profile/auth";
import { AgentChatKeys } from "../chat/models.js";

export type UserId = string | number;

export interface User {
    uid: number
}

export interface Account extends User {
    credit?: number
}

export interface Storage extends AgentAuthStore {
    recordChatCost: ( keys: AgentChatKeys, cost: number | undefined ) => void,
    fetchAccountFields: ( uid: UserId, fields?: string ) => Promise<Account | undefined>
}

