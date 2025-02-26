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
    var err = { code:code, message:message, details:details };
    log(req,code,err);
    res.status( errorCodeToStatusCode(code) ).json({failure:err});
}

function errorCodeToStatusCode( code: number[] | undefined ) {
    if( !code )
        return 500;
    let result = code[0]*100;
    if( code.length > 1 )
        result += code[1];

    return result;
}

// Use this method when we have an Error object
export function signalError( req: Request, res: Response, err:any ) {
    if( err instanceof ServerError && err.code ) {
        log(req,err.code,err);
        res.status( errorCodeToStatusCode(err.code) ).json({failure:err});
    } else {
        log(req,500,err);
        var failure = { code:[5], message:err.toString() };
        res.status( 500 ).json( {failure:failure} );
    }
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

function log( req: Request, code: number[] | number, err: any ) {
    const auth = (req as any).auth;
    const details = {
        code:code,
        url:req.originalUrl,
        headers:req.headers,
        auth,
        body:req.body    
    }
    console.error( 'ERROR: ' + JSON.stringify(details,null,4), err.message );
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