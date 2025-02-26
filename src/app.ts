import express from "express"
import morgan from "morgan"
import cors from "cors"

// import { fileURLToPath } from "url";
// import { dirname, join } from "path";

//import openRoutes from "./routes.js"

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

const app = express()
app.use( morgan("combined") )
app.use( cors() )
app.options( "*", cors() )

// app.use("/", express.static(join(__dirname, "../www")))

app.use( express.json({ limit:"1mb" }) )
app.use( express.urlencoded({ extended: true }) )
app.use( express.raw({ limit:"10mb", type:"*/*" }) )

// wire in the open and secured (auth-token required) API
//app.use("/v1", openRoutes(express));

export default app