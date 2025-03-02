import {
    AgentChatKey,
    ChatMessage,
    ChatMessageEnvelope,
    HandleAgentChatMessageParams
} from "./models.js";
import {
    ChatCompletionResult
} from "../ai-providers/models.js";
import { ensureBalance } from "../agent/billing.js";
import { createCanonicalProfileUri } from "../agent/util.js";
import { User } from "../storage/models.js";
import { storage } from "../storage/handle.js"
import { ServerError } from "../util/net.js";
import { chatCompletion } from "./completion.js";


export async function handleAgentChatMessage({ uid, pathname, envelope, agentSession }: HandleAgentChatMessageParams) {
    const { canonicalUri, agentUrl: clientAgentUrl } = agentSession;    // client agent URI
    const { message, rewind } = envelope;
    const chatKey = { uid, pathname, canonicalUri, clientAgentUrl } as AgentChatKey;

    console.log( "handleAgentChatMessage", chatKey );

    // save incoming message locally
    if( rewind )
        await rewindChat( chatKey, envelope );
    else if( message ) {
        message.from = canonicalUri;  // ensure 'from' is correct
        //const messageJSON = JSON.stringify(message);
        //await queryResult( INSERT_MESSAGE, [messageJSON,uid,canonicalUri] );
        await storage().insertChatMessage( chatKey, message );
    } else
        return { reply: null };  // nothing to do

    // fetch all messages for AI
    let chat = await storage().fetchAgentChat( chatKey );
    if( !chat ) {
        console.log( "Failed to find history, creating new chat", uid, canonicalUri );
        chat = await storage().ensureAgentChat( chatKey, [ message as ChatMessage ] );
    }
    const history = chat.history;

    // generate reply and track cost
    const { reply, cost } = await generateChatReply( uid, history?.messages ?? []);
    await storage().recordChatCost( chatKey, cost );

    // save reply locally
    //const replyJSON = JSON.stringify(reply);
    //await queryResult( INSERT_MESSAGE, [replyJSON,uid,canonicalUri] );
    await storage().insertChatMessage( chatKey, reply );

    return { reply };
}

// profile URI must be canonical!
async function rewindChat( chatKey: AgentChatKey, envelope: ChatMessageEnvelope ) {
    const { message, rewind } = envelope; 
    /*const chat = await queryFirstRow<AgentChat>(
        "SELECT history FROM agent_chats WHERE uid=? AND profile_uri=?",
        [uid,canonicalUri]
    );*/
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
    /*await queryResult(
        "UPDATE agent_chats SET history=? WHERE uid=? AND profile_uri=?",
        [ JSON.stringify(historyUpdate),uid,canonicalUri]
    ); */
}

export async function generateChatReply( uid: string | number, messages: ChatMessage[] ): Promise<ChatCompletionResult> {
    const canonicalUri = createCanonicalProfileUri( uid );
    //const personas = (await fetchPersonas( uid ))?.personas?.filter(e=>!e.hidden);  // except hidden

    //const user = await queryFirstRow<User>("SELECT uid,name FROM users WHERE uid=?",[uid]);
    const user = await storage().fetchAccountFields( uid, "uid,name,credit" );
    if( !user )
        throw new Error("Unable to generate chat reply, cannot find user with id " + uid );
    await ensureBalance( uid, user );

    // if there are no messages from me, then introduce myself
    if( messages.some(e=>e.from === canonicalUri) !== true ) {
        console.log( 'intro', canonicalUri, messages );
        return introduceMyself( user ); //, personas, canonicalUri );
    }

    // Craft an instruction for AI with my role and goals
    //const userGoals = personas.filter(e=>e.meta?.goals).map(e=>e.meta.goals).join('\n\n');
    //const instruction = buildInstruction( user, userGoals );
    
    //const bridge = selectBridge();
    //return await bridge.completion({ canonicalUri, messages }); // , instruction })
    return await chatCompletion({ canonicalUri, messages });
}

function introduceMyself( user: User ): ChatCompletionResult {
    const reply = { content: "Nice to meet you!" } as ChatMessage;
    return { reply, cost: 0.01 };
}