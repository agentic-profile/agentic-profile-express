import {
    ChatCompletionResult,
    selectAIProvider
} from "@agentic-profile/ai-provider";

import {
    agentHooks,
    ChatMessage,
    DID
} from "@agentic-profile/common";

import {
    ChatHooks,
    GenerateChatReplyParams,
    User
} from "@agentic-profile/chat";
import { buildInstruction } from "./instruction.js";


export async function generateChatReply({ uid, agentDid, messages}: GenerateChatReplyParams ): Promise<ChatCompletionResult> {
    //const personas = (await fetchPersonas( uid ))?.personas?.filter(e=>!e.hidden);  // except hidden

    const user = await storage().fetchAccountFields( uid, "uid,name,credit" );
    if( !user )
        throw new Error("Unable to generate chat reply, cannot find user with id " + uid );
    await agentHooks<ChatHooks>().ensureCreditBalance( uid, user );

    // if there are no messages from me, then introduce myself
    if( messages.some(e=>e.from === agentDid) !== true ) {
        console.log( 'intro', agentDid, messages );
        return introduceMyself( user, agentDid );
    }

    // Craft an instruction for AI with my role and goals
    const userGoals = ''; // personas.filter(e=>e.meta?.goals).map(e=>e.meta.goals).join('\n\n');
    const instruction = buildInstruction( user, userGoals );

    const provider = selectAIProvider( process.env.AP_AI_PROVIDER ?? "eliza:" );
    return await provider.completion({ agentDid, messages, instruction });

    /* e.g.
    const reply = {
        from: agentDid,
        content: "Tell me more...",
        created: new Date()
    } as ChatMessage;
    return { reply };
    */
}

function introduceMyself( user: User, userAgentDid: DID ): ChatCompletionResult {
    const reply = {
        from: userAgentDid,
        content: `My name is ${user.name}. Nice to meet you!`,
        created: new Date()
    } as ChatMessage;
    return { reply, cost: 0.01 };
}

function storage() {
    return agentHooks<ChatHooks>().storage;
}