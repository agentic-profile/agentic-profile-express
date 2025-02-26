import { Storage } from "./models.js";

let instance: Storage | undefined = undefined;

export function setStorage( storage: Storage ) {
	instance = storage;
}

export function storage() {
	if( !instance )
		throw new Error('Accessed storage() before initializing');
	else
		return instance;
}