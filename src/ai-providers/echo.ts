import {
    AIProvider,
    ChatCompletionParams
} from "./models.js"
import { ChatMessage } from "../chat/models.js"

export default class Echo implements AIProvider {
    private model: string;

    constructor( model?: string ) {
        this.model = model || 'echo-1.0';
        console.log( 'Echo with', this.model );
    }

    get ai() {
        return 'echo:' + this.model;
    }

    get poweredBy() {
        const version = this.model.split('-').splice(1).join(' ');
        return 'Echo ' + version;
    }

    async completion( params: ChatCompletionParams ) {
        const reply = { content: "Hello" } as ChatMessage;
        return { reply, cost: 0.01 }
    }
}