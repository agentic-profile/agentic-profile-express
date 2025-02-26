//
// For running with Lamdba
//

import serverlessExpress from "@codegenie/serverless-express"
import app from "./dist/app.js"

const seHandler = serverlessExpress({ app });

export function handler(event, context, callback ) {
    context.callbackWaitsForEmptyEventLoop = false;
    return seHandler( event, context, callback );
}