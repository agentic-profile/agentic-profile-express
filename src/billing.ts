import {
    agentHooks,
    CommonHooks,
} from "@agentic-profile/common";
import { ServerError } from "@agentic-profile/express-common";

import {
    Account,
    Storage,
    UserId
} from "./storage/models.js";


export async function ensureCreditBalance( uid: UserId, actor?: Account ) {
    if( actor && uid == actor.uid ) {
        if( !actor.credit || actor.credit <= 0 )
            throw new ServerError([4],"You are out of credits");
        else
            return actor.credit;
    }

    const storage = agentHooks<CommonHooks>().storage as Storage;
    const user = await storage.fetchAccountFields( uid, "credit" );
    if( !user )
        throw new ServerError([5],"Failed to find user: " + uid );
    else if( !user.credit || user.credit! <= 0 )
        throw new ServerError([4],"You are out of credit");
    else
        return user.credit;
}
