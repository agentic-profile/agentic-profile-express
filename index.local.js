console.log( 'Running Node locally...' );

import 'dotenv/config';
import express from "express";

import {
    handleAgentChatMessage
//} from "./dist/chat/simple.js";
} from "@agentic-profile/chat";
import { setAgentHooks } from "@agentic-profile/common";

import {
    app,
    ensureCreditBalance,
    generateChatReply,
    InMemoryStorage,
    MySQLStorage,
    openRoutes
} from './dist/index.js';

import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use("/", express.static(
    join(__dirname, "www")
));

const Storage = process.env.AP_STORAGE === 'mysql' ? MySQLStorage : InMemoryStorage;
const port = process.env.PORT || 3003;
const TESTING_DID_PATH = `localhost%3A${port}:iam`;
setAgentHooks({
    generateChatReply,
    storage: new Storage(),
    createUserAgentDid: (uid) => `did:${process.env.AP_DID_PATH ?? TESTING_DID_PATH}:${uid}`,
    ensureCreditBalance,
    handleAgentChatMessage
});

app.use("/", openRoutes({
    status: { name: "Testing Agentic Profile" }
}));

app.listen(port, () => {
    console.info(`Agentic Profile Express listening on http://localhost:${port}`);
});