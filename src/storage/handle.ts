import crypto from "crypto";

import { Storage } from "./models.js";

let instance: Storage | undefined = undefined;
let name = crypto.randomBytes(32).toString("base64");

export function setStorage( storage: Storage ) {
	instance = storage;
	console.log( 'setStorage', instance, name );
}

export function storage() {
	if( !instance ) {
		console.error( 'no storage!', instance, name, new Error('Storage not ready') );
		throw new Error('Accessed storage() before initializing');
	} else
		return instance;
}