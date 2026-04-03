// src/controllers/authController.js
// ─────────────────────────────────────────────────────
// Controller = the actual business logic for each route.
// Keeping this separate from routes/ makes the code cleaner
// and easier to test.
// ─────────────────────────────────────────────────────

const {supabaseAuth,supabaseAdmin} = require('../config/supabase')

console.log("AUTH:", supabaseAuth)
console.log("ADMIN:", supabaseAdmin)

// ── signup ────────────────────────────────────────────
// What it does:
//   1. Validates all fields are present
//   2. Checks role is either 'mentor' or 'student'
//   3. Creates the user in Supabase Auth
//      (email_confirm: true skips email verification for dev)
//   4. Supabase trigger auto-creates their profiles row
//   5. Returns success — frontend then calls login
// ─────────────────────────────────────────────────────
async function signup(req, res) {
  try {
    const { email, password, full_name, role } = req.body

    // Validate required fields
    if (!email || !password || !full_name || !role) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    // Validate role value
    if (!['mentor', 'student'].includes(role)) {
      return res.status(400).json({ error: 'Role must be mentor or student' })
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    // Create user in Supabase Auth
    // user_metadata is stored in auth.users and picked up by our DB trigger
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role }
    })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: data.user.id,
        email: data.user.email,
        role,
        full_name
      }
    })
  } catch (err) {
    console.error('[signup] Error:', err.message)
    res.status(500).json({ error: 'Signup failed. Please try again.' })
  }
}

// ── login ─────────────────────────────────────────────
// What it does:
//   1. Validates email + password are present
//   2. Calls Supabase signInWithPassword
//   3. Fetches the user's role from profiles table
//   4. Returns access_token + user info
//      Frontend stores token in localStorage
// ─────────────────────────────────────────────────────
async function login(req, res) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.log("LOGIN ERROR:", error.message)
      return res.status(401).json({ error: error.message })
    }

    if (!data || !data.user) {
      return res.status(401).json({ error: "Invalid login response" })
    }

    console.log("LOGIN USER ID:", data.user.id)
    console.log("LOGIN USER METADATA:", data.user.user_metadata)

    const metadata = data.user.user_metadata || {}

    return res.json({
      message: 'Login successful',
      access_token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: metadata.role || 'student',
        full_name: metadata.full_name || ''
      }
    })

  } catch (err) {
    console.error('[login] Error:', err.message)
    return res.status(500).json({ error: 'Login failed. Please try again.' })
  }
}

// ── getMe ─────────────────────────────────────────────
// What it does:
//   - Returns the currently logged-in user's info
//   - req.user is already set by requireAuth middleware
//   - Frontend uses this on page load to verify token is still valid
// ─────────────────────────────────────────────────────
function getMe(req, res) {
  res.json({ user: req.user })
}

// ── logout ────────────────────────────────────────────
// What it does:
//   - Invalidates the token on Supabase's side
//   - Frontend should also clear localStorage
// ─────────────────────────────────────────────────────
async function logout(req, res) {
  try {
    const token = req.headers.authorization.replace('Bearer ', '')
    await supabaseAuth.auth.admin.signOut(token)
    res.json({ message: 'Logged out successfully' })
  } catch (err) {
    console.error('[logout] Error:', err.message)
    res.status(500).json({ error: 'Logout failed' })
  }
}

module.exports = { signup, login, getMe, logout }
