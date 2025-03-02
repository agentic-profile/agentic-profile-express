console.log( 'Running Node locally...' );

import 'dotenv/config';
import express from "express";
import {
    app,
    InMemoryStorage,
    openRoutes,
    setStorage
} from './dist/index.js';

import {
    handleAgentChatMessage
//} from "./dist/chat/simple.js";
} from "./dist/chat/full.js";

import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use("/", express.static(
    join(__dirname, "www"),
    { index: 'index.json' }
));

setStorage( new InMemoryStorage() );

app.use("/v1", openRoutes({
    status: { name: "Testing" },
    handleAgentChatMessage
}));

const port = process.env.PORT || 3003;
app.listen(port, () => {
    console.info(`Agentic Profile Node Service listening on http://localhost:${port}`);
});