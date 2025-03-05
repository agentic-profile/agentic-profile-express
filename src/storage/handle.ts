import { Storage } from "./models.js";

export function setStorage( storage: Storage ) {
    (globalThis as any).__storage = storage;
    console.log( 'setStorage', storage );
}

export function storage() {
    if( !(globalThis as any).__storage ) {
        console.error( 'no storage!' );
        throw new Error('Accessed storage() before initializing');
    } else
        return (globalThis as any).__storage as Storage;
}
