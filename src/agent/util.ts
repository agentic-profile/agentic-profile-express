import axios from "axios";
import {
    AgenticProfile,
    CanonicalURI,
    ProfileURI
} from "@agentic-profile/auth";

import { ServerError } from "../util/net.js";
import { createTimer } from "../util/index.js";

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

export async function fetchAgenticProfile( profileUri: ProfileURI ) {
    const { data } = await axios.get( profileUri );
    return data as AgenticProfile;
}

function isProfileURICanonical( profileUri: ProfileURI ) {
    const url = new URL( profileUri );
    const lastPart = url.pathname.split('/').pop();
    if( !lastPart )
        throw new ServerError([4],"Invalid agentic profile URI: " + profileUri );
    else
        return /^\d+$/.test( lastPart );    // all digits?  ...then canonical!
}

export async function resolveCanonicalProfileUri( profileUri: ProfileURI ): Promise<CanonicalURI> {
    if( isProfileURICanonical( profileUri ) )
        return profileUri as CanonicalURI;

    // <==== EXPENSIVE: TODO fix, use cached version?
    const { elapsed } = createTimer("resolveCanonicalProfileUri");
    const profile = await fetchAgenticProfile( profileUri );
    if( !profile.canonicalUri )
        throw new ServerError([4],"Agentic profile does not include reference to canonical URI: " + profileUri );

    const uri = new URL( profile.canonicalUri, profileUri ).toString() as CanonicalURI;

    // TODO, check for akaUris back to original profileUri

    elapsed( "fetched profile", profileUri, uri );
    return uri;
}