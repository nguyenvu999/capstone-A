import "dotenv/config"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseBucket = process.env.SUPABASE_BUCKET

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL is missing in .env")
}

if (!supabaseServiceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing in .env")
}

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(supabaseBucket)
      .list("", { limit: 1 })

    if (error) {
      throw new Error(error.message)
    }

    console.log("Supabase connected")
    return true
  } catch (error) {
    console.error("Supabase connection failed:", error.message)
    throw error
  }
}