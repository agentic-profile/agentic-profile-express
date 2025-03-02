import { ChatMessage } from "./models.js";
import {
    ChatCompletionParams,
    ChatCompletionResult
} from "../ai-providers/models.js";


export async function chatCompletion({ canonicalUri, messages }: ChatCompletionParams ): Promise<ChatCompletionResult> {
	//const bridge = selectBridge();
    //return await bridge.completion({ canonicalUri, messages }); // , instruction })

    const reply = {
        from: canonicalUri,
        content: "Tell me more...",
        created: new Date()
    } as ChatMessage;
    console.log( "chatCompletion", canonicalUri, messages );
    return { reply };
}