import { storage } from "../storage/handle.js";
import {
    Account,
    UserId
} from "../storage/models.js";
import { ServerError } from "../util/net.js";

export async function ensureBalance( uid: UserId, actor?: Account ) {
    if( actor && uid == actor.uid ) {
        if( !actor.credit || actor.credit <= 0 )
            throw new ServerError([4],"You are out of credits");
        else
            return actor.credit;
    }

    const user = await storage().fetchAccountFields( uid, "credit" );
    if( !user )
        throw new ServerError([5],"Failed to find user: " + uid );
    else if( !user.credit || user.credit! <= 0 )
        throw new ServerError([4],"You are out of credit");
    else
        return user.credit;
}
