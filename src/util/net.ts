import {
    NextFunction,
    Request, 
    Response
} from 'express'

import { inherits } from 'util'

//
// Errors are coded with an integer array.  The leftmost/first number
// is the most significant, with each subsequent number having less
// significance.
//
// The first number is designed to correspond to the major classes
// of HTTP status codes:
// 2 => 2xx, OK status codes
// 4 => 4xx, Request failed due to incorrect client call
// 5 => 5xx, Request failed because of a server problem
//

// Use this method when we DON'T have an Error object
export function signalNotOk( req:Request, res:Response, code:number[], message:string, details:any ) {
    const failure = { code, message, details };
    log(req,failure);
    res.status( errorCodeToStatusCode(code) ).json({failure});
}

function errorCodeToStatusCode( code: any ) {
    if( !code || !Array.isArray(code) )
        return 500;
    const parts = code as any[];
    if( parts.length === 0 || parts.some(e=>Number.isFinite(e) !== true) )
        return 500;

    let result = parts[0]*100;
    if( parts.length > 1 )
        result += parts[1];

    return result;
}

// Use this method when we have an Error object
export function signalError( req: Request, res: Response, err:any ) {
    const { code, name, message, stack } = err;
    const failure = {
        code,
        message: message ?? name,
        details: stack?.split(/\n/).map((e:string)=>e.trim()).slice(0,3)
    }
    log(req,failure,err);
    res.status( errorCodeToStatusCode(code) ).json({ failure });
}

export class ServerError extends Error {
    code: number[];           // Array of HTTP status codes
    details: string[] | undefined;  // Optional technical or support details

    // code: []
    // messagge: Human readable
    // details: [] Tech support understandable
    constructor(code: number[], message: string, details?: string[]) {
        super(message);       // Call the parent class constructor
        Error.captureStackTrace(this, this.constructor); // Attach the stack trace
        this.name = this.constructor.name;  // Set the error name

        this.code = code;     // Assign the provided status code(s)
        this.details = details;  // Assign the provided details
    }
}

// Ensure proper inheritance of Error class in older environments
inherits(ServerError, Error);

function log( req: Request, failure: any, err?: any ) {
    const auth = (req as any).auth;
    console.error( 'ERROR:', JSON.stringify({
        url: req.originalUrl,
        headers: req.headers,
        auth,
        body: req.body,
        failure,
        errorMessage: err?.message
    },null,4) );
}

export function baseUrl( req: Request ) {
    if( process.env.SERVICE_CALLBACK_BASE_URL )
        return process.env.SERVICE_CALLBACK_BASE_URL;

    const protocol = process.env.SERVICE_CALLBACK_HTTP_PROTOCOL || req.protocol;
    return (protocol + "://" + req.get('host')).toLowerCase();
}

export type AsyncMiddleware = (req: Request, res: Response, next: NextFunction) => Promise<any>;

export const asyncHandler = (fn: AsyncMiddleware) => function( req: Request, res: Response, next: NextFunction ) {
    const fnReturn = fn(req,res,next)
    return Promise.resolve(fnReturn).catch( err => {
        signalError(req,res,err);
    });
}

export function sendBearer401( res: Response, reason: string ) {
    res.statusCode = 401;
    res.setHeader('WWW-Authenticate', 'Bearer realm="Agentic-Profile"');

    const failure = { code:[4,1], message: 'Access Denied: ' + reason };
    res.json({ failure });   
}

/*
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
        throw new Error('Invalid URL provided');
    }
}*/
