import { storage } from "../storage/handle.js";
import {
    Account,
    UserId
} from "../storage/models.js";
import { ServerError } from "../util/net.js";
import { AgentChatKeys } from "./chat/models.js";

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

/*
export async function recordChatCost( { uid, canonicalUri }: AgentChatKeys, cost: number | undefined ) {
    if( !cost )
        return;

    await updateDB(
        "UPDATE users SET credit=credit-? WHERE uid=?",
        [cost,uid],
        "Failed to update user credit with inference cost"
    );

    await updateDB(
        "UPDATE agent_chats SET cost=cost+? WHERE uid=? AND profile_uri=?",
        [cost,uid,canonicalUri],
        "Failed to update chat with inference cost"
    ); 
}
*/