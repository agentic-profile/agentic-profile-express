import express from "express"
import morgan from "morgan"
import cors from "cors"

const app = express()
app.use( morgan("combined") )
app.use( cors() )
app.options( "*", cors() )

app.use( express.json({ limit:"1mb" }) )
app.use( express.urlencoded({ extended: true }) )
app.use( express.raw({ limit:"10mb", type:"*/*" }) )

export default app