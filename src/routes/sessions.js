// src/routes/sessions.js
console.log("sesssion.js loaded");

const express = require('express')
const { requireAuth, requireRole } = require('../middleware/authMiddleware')
const {
  createSession,
  joinSession,
  startSession,
  endSession,
  getMySessions,
  getSessionByCode,
  getSessionById
} = require('../controllers/sessionController')

const router = express.Router()

// ── Mentor routes ─────────────────────────────────────

router.post(
  '/',
  requireAuth,
  requireRole('mentor'),
  createSession
)


router.get(
  '/mine',
  requireAuth,
  
  getMySessions
)
router.get('/by-id/:id', requireAuth, getSessionById)

router.patch(
  '/:session_id/start',
  requireAuth,
  requireRole('mentor'),
  startSession
)

router.patch(
  '/:session_id/end',
  requireAuth,
  requireRole('mentor'),
  endSession
)

// ── Shared routes ─────────────────────────────────────

// ✅ FIXED: NO requireAuth here
router.get(
  '/code/:invite_code',
  
  getSessionByCode
)

// ✅ KEEP THIS AS IS (auth required)
console.log("join route registered");

router.post(
  '/join/:invite_code',
  requireAuth,
  requireRole('student'),
  joinSession
)

module.exports = router