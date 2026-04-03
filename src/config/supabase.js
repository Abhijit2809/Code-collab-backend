const { createClient } = require('@supabase/supabase-js')

// 🔐 Public client (for login)
const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// 🔑 Admin client (for signup, protected ops)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

module.exports = {
  supabaseAuth,
  supabaseAdmin
}