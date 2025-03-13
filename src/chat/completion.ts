import { ChatMessage } from "./models.js";
import {
    ChatCompletionParams,
    ChatCompletionResult
} from "../ai-providers/models.js";


export async function chatCompletion({ agentDid, messages }: ChatCompletionParams ): Promise<ChatCompletionResult> {
	//const bridge = selectBridge();
    //return await bridge.completion({ canonicalUri, messages }); // , instruction })

    const reply = {
        from: agentDid,
        content: "Tell me more...",
        created: new Date()
    } as ChatMessage;
    console.log( "chatCompletion", agentDid, messages );
    return { reply };
}