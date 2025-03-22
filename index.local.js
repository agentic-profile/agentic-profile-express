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
    InMemoryStorage,
    MySQLStorage,
    openRoutes
} from './dist/index.js';
import {
    generateChatReply
} from "./dist/chat/chat.js";

import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use("/", express.static(
    join(__dirname, "www")
));

const Storage = process.env.AP_STORAGE === 'mysql' ? MySQLStorage : InMemoryStorage;
const port = process.env.PORT || 3003;
const TESTING_DID_DOMAIN = `localhost%3A${port}:iam`;
setAgentHooks({
    generateChatReply,
    storage: new Storage(),
    createUserAgentDid: (uid) => `did:web:${process.env.AP_DID_DOMAIN ?? TESTING_DID_DOMAIN}:${uid}`,
    ensureCreditBalance,
    handleAgentChatMessage
});

app.use("/", openRoutes({
    status: { name: "Testing Agentic Profile" }
}));

app.listen(port, () => {
    console.info(`Agentic Profile Express listening on http://localhost:${port}`);
});