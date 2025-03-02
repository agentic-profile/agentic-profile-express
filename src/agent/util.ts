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

/*
export function resolveAgentProfileUid( profileUri: ProfileURI ) {
    const pattern = /^https:\/\/iamagentic\.ai\/(\d+)$/;
    const match = profileUri.match(pattern);
    return match ? parseInt(match[1]) : null;
}*/

/*
export function createVanityProfileUri( uid: number | string ) {
    return `https://iamagentic.ai/${uid}`;
}*/

export function createCanonicalProfileUri( uid: number | string ) {
    return `https://iamagentic.ai/${uid}`;
}