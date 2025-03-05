import {
    //FunctionDeclarationSchemaType,
    HarmBlockThreshold,
    HarmCategory,
    VertexAI
} from "@google-cloud/vertexai";
import { CanonicalURI } from "@agentic-profile/auth";

import { ServerError } from "../util/net.js"
import { asJSON } from "./util.js"
import { ChatMessage } from "../chat/models.js"
import {
    AIProvider,
    ChatCompletionParams,
    ChatCompletionResult,
} from "./models.js"

const project = "avatar-factory-ai";
const location = "us-west1";
const vertexAI = new VertexAI({ project, location });

/*
    Gemini API: Advanced reasoning, multiturn chat, code generation, and multimodal prompts.
    PaLM API: Natural language tasks, text embeddings, and multiturn chat.
*/

const TOKEN_COST = 0.0015 / 1000;   // $1.50/M
const TOKEN_MARKUP = 10;    // ten times

interface MessagePart {
    text: string
}

interface VertexMessage {
    role: 'user' | 'model',
    parts: MessagePart[]
}


export class VertexAIBridge implements AIProvider {
    private model: string;

    constructor( model?: string ) {
        this.model = model || 'gemini-1.5-pro';
        console.log( 'Vertex AI using', this.model );
    }

    get ai() {
        return 'vertex:' + this.model;
    }

    get poweredBy() {
        const version = this.model.split('-').splice(1).join(' ');
        return 'Gemini ' + version;
    }

    // prompt:  Last user message, telling AI what to do 
    // messages: [{ name:, role:, content: string }]
    //          order must always be user => model => user => model
    //          First must be user, last must be model
    // instruction:  system instruction, overall goals, etc.
    async completion( completionParams: ChatCompletionParams ) {
        if( !vertexAI )
            throw new ServerError([5],'Vertex did not start');

        // prepare
        const generativeModel = getGenerativeModel( this.model ); 
        const params = await prepareParams( generativeModel, completionParams );

        // generate
        console.log( "Genderating content for", JSON.stringify(params,null,4) );
        const { response } = await generativeModel.generateContent( params );
        if( !response.candidates || !response.candidates.length )
            throw new ServerError( [5], "No AI inference: " + JSON.stringify(response,null,4) );
        const { finishReason, safetyRatings, content } = response.candidates[0];
        if( finishReason == 'SAFETY' ) {
            const details = describeSafetyRatings( safetyRatings );
            throw new ServerError([5],'Blocked by safety net: ' + details );
        }

        // make heads and tails from AI result...
        if( !content || !content.parts.length )
            throw new ServerError( [5], "No AI content: " + JSON.stringify(response,null,4) );

        const reply = cleanReply( content.parts[0].text );
        if( !reply ) {
            //console.log( "No content generated for", JSON.stringify(params,null,4) );
            throw new ServerError( [5], "No AI text content: " + JSON.stringify(response,null,4) );
        }

        // any JSON?
        const json = asJSON( reply );
                
        const { totalTokens: completion_tokens } = await generativeModel.countTokens({ contents: [content] });
        const {
            promptTokenCount: prompt_tokens = 0,
            //candidateTokenCount: completion_tokens,
            totalTokenCount: total_tokens = 0
        } = response.usageMetadata || {};
        const usage = { prompt_tokens, completion_tokens, total_tokens };
        const cost = usage ? total_tokens * TOKEN_COST * TOKEN_MARKUP : 0;

        const messageTail = params.contents.slice(-3);
        const messageCount = params.contents.length;
        const { canonicalUri, instruction } = completionParams;
        console.log(
            `\n\n==== Vertex completion ${this.model} on messages:\n\n`,
            JSON.stringify( messageTail, null, 4 ),
            '\n\n==== Instruction:', instruction,
            '\n\n==== Reply:', reply,
            '\n\n==== JSON:', JSON.stringify( json, null, 4 ), 
            { messageCount }
        );

        return { 
            reply: { from: canonicalUri, content: reply, created: new Date() } as ChatMessage, 
            json, 
            usage, 
            cost, 
            messageContext: { tail: messageTail, count: messageCount }
        } as ChatCompletionResult;
    }
}

function toMessage( role:string, text:string ) {
    return { role, parts:[{ text }] } as VertexMessage;    
}

function isAgentMessage( message: ChatMessage, canonicalUri: CanonicalURI ) {
    return message.from === canonicalUri;
}

// { role: 'user'|'assistant'|'system', name:, content: string }
// => { role: 'user'|'model', parts:[{text}] }
function convertMessages( messages: ChatMessage[], canonicalUri: CanonicalURI ) {
    if( !messages )
        return [];
    const vMessages = messages.map(m=>{
        const role = isAgentMessage( m, canonicalUri ) ? 'model' : 'user';
        return toMessage( role, m.content );
    });

    // ensure messages alternate between user and model, combining if necessary
    // messages must be oldest first, and newest last
    let result: VertexMessage[] = [];
    vMessages.forEach(m=>{
        if( result.length > 0 ) {
            const newest = result[result.length-1];
            if( newest.role === m.role ) {
                newest.parts[0].text += '\n\n' + m.parts[0].text;
                return;
            }
        }

        result.push(m);
    });
    return result;
}

function getGenerativeModel( model: string ) {
    const threshold = HarmBlockThreshold.BLOCK_ONLY_HIGH;
    return vertexAI.getGenerativeModel({
        model,
        safetySettings: [
            {
                category: HarmCategory.HARM_CATEGORY_UNSPECIFIED,
                threshold
            },
            {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold
            },
            {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold
            },
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold
            },
            {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold
            },
        ],
        generationConfig: { maxOutputTokens: 1000 },
    });
}

async function prepareParams( generativeModel: any, { prompt, canonicalUri, messages, instruction }: ChatCompletionParams ) {
    const params = {} as any;
    const contents = convertMessages( messages, canonicalUri );
    //if( contents )
    params.contents = contents;

    if( prompt ) {
        if( lastMessage( contents )?.role === 'user' )
            contents.push( toMessage( 'model', 'I understand') );   

        contents.push( toMessage( 'user', prompt ) );   
    }

    if( contents[0].role === 'model' )
        contents.unshift( toMessage('user','Hello') );  // First message must be from user

    // last message must always be from user
    if( lastMessage( contents )?.role !== 'user' )
        contents.push( toMessage('user','Tell me more') );

    let { totalTokens: inputTokens } = await generativeModel.countTokens({ contents });
    if( instruction ) {
        const systemInstruction = {
            role: 'developer',
            parts: [
                { text: instruction }
            ]
        };
        params.systemInstruction = systemInstruction;

        const { totalTokens: systemTokens } = await generativeModel.countTokens({ contents: [ systemInstruction ] });
        inputTokens += systemTokens;
    }

    return params;
}

function percentage(n:number) {
    return '' + Math.floor(n*100) + '%';
}

function lastMessage( messages: VertexMessage[] ) {
    return messages[ messages.length - 1 ];
}

function cleanReply( reply:string | undefined ) {
    if( !reply )
        return reply;
    else
        return reply.replace(/&#x20;/g, '').replace('<br>','').trim();
}

function describeSafetyRatings( safetyRatings:any ) {
    if( !safetyRatings )
        return 'Unknown';

    console.log( 'safety ratings', JSON.stringify(safetyRatings,null,4) );

    return safetyRatings.reduce((result:any,e:any)=>{
        if( e.blocked ) {
            const { category, probabilityScore, severityScore } = e;
            const label = category.toLowerCase().split('_').splice(2).join(' ');
            result.push( `${label} (${percentage(probabilityScore)} ${percentage(severityScore)})` );
        }
        return result;
    },[]).join();
}