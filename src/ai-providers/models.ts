import { CanonicalURI } from "@agentic-profile/auth"
import { ChatMessage } from "../chat/models.js"

export interface TokenCounts {
    prompt_tokens: number,
    completion_tokens: number,
    total_tokens: number   
}

export interface MessageContext {
    tail: any[],    // TODO use ChatMessage?
    count: number
}

export interface ChatCompletionParams {
    prompt?: string,
    canonicalUri: CanonicalURI,
    messages: ChatMessage[],
    instruction?: string   
}

export interface ChatCompletionResult {
    reply: ChatMessage,
    json?: any,
    usage?: TokenCounts,
    cost?: number,
    messageContext?: MessageContext
}

export interface AIProvider {
    completion: ( params: ChatCompletionParams ) => Promise<ChatCompletionResult>
}