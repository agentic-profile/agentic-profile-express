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
setAgentHooks({
    generateChatReply,
    storage: new Storage(),
    createUserAgentDid: (uid) => `did:web:${process.env.AP_DID_DOMAIN ?? "localhost%3A3003:iam"}:${uid}`,
    ensureCreditBalance
});

app.use("/", openRoutes({
    status: { name: "Testing" },
    handleAgentChatMessage
}));

const port = process.env.PORT || 3003;
app.listen(port, () => {
    console.info(`Agentic Profile Express listening on http://localhost:${port}`);
});