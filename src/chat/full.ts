import {
    DID
} from "@agentic-profile/auth";

import {
    AgentChatKey,
    ChatMessage,
    ChatMessageEnvelope,
    HandleAgentChatMessageParams
} from "./models.js";
import {
    ChatCompletionResult
} from "../ai-providers/models.js";
import { ensureBalance } from "../accounts/billing.js";
import { User } from "../storage/models.js";
import { storage } from "../storage/handle.js";
import { ServerError } from "../util/net.js";
import { chatCompletion } from "./completion.js";
import { agentHooks } from "../hooks.js";


export async function handleAgentChatMessage({ uid, envelope, agentSession }: HandleAgentChatMessageParams) {
    const { did: clientAgentDid } = agentSession;    // client agent URI
    const serverAgentDid = "did:example:uid:" + uid;
    const { message, rewind } = envelope;
    const chatKey = { uid, serverAgentDid, clientAgentDid } as AgentChatKey;

    console.log( "handleAgentChatMessage", chatKey, message );

    // validate the message
    if( !message )
        throw new ServerError( [4], "Missing chat message" );
    if( message.from !== clientAgentDid )
        throw new ServerError( [4], "Chat message 'from' does not match session agentDid: " + message.from + ' != ' + clientAgentDid );
    if( !message.created )
        throw new ServerError( [4], "Chat message missing 'created' property" );
    if( !message.content )
        throw new ServerError( [4], "Chat message missing content" );

    // save incoming message locally
    if( rewind )
        await rewindChat( chatKey, envelope );
    else {
        await storage().insertChatMessage( chatKey, message, true );
    }

    // fetch all messages for AI
    let chat = await storage().fetchAgentChat( chatKey );
    if( !chat ) {
        console.log( "Failed to find history, creating new chat", chatKey );
        chat = await storage().ensureAgentChat( chatKey, [ message as ChatMessage ] );
    }
    const history = chat.history;

    // generate reply and track cost
    const { reply, cost } = await agentHooks().generateChatReply( uid, history?.messages ?? []);
    await storage().recordChatCost( chatKey, cost );

    // save reply locally
    await storage().insertChatMessage( chatKey, reply );

    return { reply };
}

export async function rewindChat( chatKey: AgentChatKey, envelope: ChatMessageEnvelope ) {
    const { message, rewind } = envelope; 
    const chat = await storage().fetchAgentChat( chatKey );
    if( !chat )
        throw new ServerError([4],`Failed to rewind; could not find chat ${chatKey} ${rewind}`);    

    let history = chat.history ?? {};
    if( !history.messages )
        history.messages = [];
    const rewindDate = new Date(rewind!);
    let p = history.messages.findIndex(e=>e.created && new Date(e.created) >= rewindDate);
    if( p === -1 ) {
        console.log( "Failed to find message to rewind to", rewindDate, history );
        p = 0;
    }

    const messages = history.messages.slice(0,p);
    if( message )
        messages.push( message );
    const historyUpdate = { ...history, messages };
    await storage().updateChatHistory( chatKey, historyUpdate );
}

export async function generateChatReply( uid: string | number, messages: ChatMessage[] ): Promise<ChatCompletionResult> {
    const agentDid = agentHooks().createAgentDid( uid );
    //const personas = (await fetchPersonas( uid ))?.personas?.filter(e=>!e.hidden);  // except hidden

    const user = await storage().fetchAccountFields( uid, "uid,name,credit" );
    if( !user )
        throw new Error("Unable to generate chat reply, cannot find user with id " + uid );
    await ensureBalance( uid, user );

    // if there are no messages from me, then introduce myself
    if( messages.some(e=>e.from === agentDid) !== true ) {
        console.log( 'intro', agentDid, messages );
        return introduceMyself( user, agentDid );
    }

    // Craft an instruction for AI with my role and goals
    //const userGoals = personas.filter(e=>e.meta?.goals).map(e=>e.meta.goals).join('\n\n');
    //const instruction = buildInstruction( user, userGoals );
    
    return await chatCompletion({ agentDid, messages });
}

function introduceMyself( user: User, agentDid: DID ): ChatCompletionResult {
    const reply = {
        from: agentDid,
        content: `My name is ${user.name}. Nice to meet you!`,
        created: new Date()
    } as ChatMessage;
    return { reply, cost: 0.01 };
}