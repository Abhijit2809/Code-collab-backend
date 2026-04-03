// src/routes/auth.js
// ─────────────────────────────────────────────────────
// Defines all /api/auth/* endpoints.
// Routes are thin — they just connect URL + method to a controller.
// All business logic lives in controllers/authController.js
// ─────────────────────────────────────────────────────

const express = require('express')
const authMiddleware = require('../middleware/authMiddleware')

console.log("AUTH MIDDLEWARE FULL:", authMiddleware)

const { requireAuth } = authMiddleware
const { signup, login, getMe, logout } = require('../controllers/authController')

console.log({
  signup,
  login,
  getMe,
  logout,
  requireAuth
})

const router = express.Router()

// POST /api/auth/signup
// Public — no auth needed
// Body: { email, password, full_name, role }
router.post('/signup', signup)

// POST /api/auth/login
// Public — no auth needed
// Body: { email, password }
// Returns: { access_token, user }
router.post('/login', login)

// GET /api/auth/me
// Protected — requires valid token
// Returns: { user: { id, email, role, full_name } }
router.get('/me', requireAuth, getMe)

// POST /api/auth/logout
// Protected — requires valid token
// Invalidates the token on Supabase side
router.post('/logout', requireAuth, logout)

module.exports = router
