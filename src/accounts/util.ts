import { ServerError } from "../util/net.js";

export function maybeDebugUrl( url: string ): string {

    if( process.env.NODE_ENV !== 'development' )
        return url;

    try {
        const parsedUrl = new URL(url);
        parsedUrl.protocol = 'http:';
        parsedUrl.hostname = 'localhost';
        parsedUrl.port = '3003';

        console.log( 'Converted',url,'to',parsedUrl.toString());
        return parsedUrl.toString();
    } catch (error) {
        throw new ServerError([4],'Invalid URL provided');
    }
}

// A general DID for the user, without specifying an exact agent
export function createAgentDid( uid: number | string ) {
    return `did:example:uid:${uid}`;
}