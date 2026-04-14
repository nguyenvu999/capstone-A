import express from "express"
import cors from "cors"
import authRoutes from "./routes/auth.routes.js"
import { errorHandler } from "./middlewares/error.middleware.js"

const app = express()

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
)

app.use(express.json())

app.get("/", (req, res) => {
  res.json({ message: "API is running" })
})

app.use("/api/auth", authRoutes)

app.use(errorHandler)

export default app