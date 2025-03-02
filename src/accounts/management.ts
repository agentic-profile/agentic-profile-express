import { storage } from "../storage/handle.js";
import { NewAccountFields } from "../storage/models.js";


export async function createAccount( fields: NewAccountFields ) {
    return await storage().createAccount( fields );
}