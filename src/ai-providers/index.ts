import { ServerError } from "../util/net.js"
import { AIProvider } from "./models.js"
import Echo from "./echo.js"

//import { VertexAIBridge } from "./VertexAIBridge.js"

export function selectAIProvider( aimodel?:string ): AIProvider {
    if( aimodel ) {
        const ai = aimodel.trim().toLowerCase();
        //if( ai.startsWith( "vertex:" ) )
        //    return new VertexAIBridge( ai.substring(7) );
        if( ai.startsWith( "echo:" ) )
            return new Echo( ai.substring(7) );
        else
            throw new ServerError([4],'Unsupported AI provider: ' + ai );
    } else
        return new Echo();
}

