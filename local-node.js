console.log( 'Running Node locally...' );

import dotenv from 'dotenv/config';
import {
    app,
    openRoutes,
} from './dist/index.js';   // simulate fetching from node package

import { setStorage } from "./dist/storage/handle.js";
import { InMemoryStorage } from "./dist/storage/memory.js";

setStorage( new InMemoryStorage() );

app.use("/v1", openRoutes({
    status: { name: "Testing" }
}));

const port = process.env.PORT || 3003;
app.listen(port, () => {
    console.info(`Agentic Profile Node Service listening on http://localhost:${port}`);
});