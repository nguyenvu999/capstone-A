import "dotenv/config"

import app from "./app.js"
import { connectDB } from "./config/db.js"
import { checkSupabaseConnection } from "./config/supabase.js"

const PORT = process.env.PORT || 8080

async function startServer() {
  await connectDB()
  await checkSupabaseConnection()

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

startServer()