// src/index.js
// ─────────────────────────────────────────────────────
// FINAL VERSION:
// - Auth + Sessions routes
// - Socket.io with authentication
// - SessionSocket handles all realtime logic
// ─────────────────────────────────────────────────────

require('dotenv').config()

const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')


// Routes
const authRouter = require('./routes/auth')
const sessionsRouter = require('./routes/sessions')
const chatRoutes = require('./routes/chat')
console.log("sessionrouter", sessionsRouter);

// Middleware
const { verifySocketToken } = require('./middleware/authMiddleware')

// 🚀 Socket Logic
const SessionSocket = require('./socket/sessionSocket')
const ChatSocket = require('./socket/chatSocket')

const app = express()
const httpServer = createServer(app)

// ── Socket.io Setup ───────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
  }
})

// Make io accessible in controllers if needed
app.set('io', io)

// ── Middlewares ───────────────────────────────────────
app.use(helmet())

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}))

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many requests. Please wait and try again.' }
})

app.use(express.json())

// ── Routes ────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRouter)
app.use('/api/sessions', sessionsRouter)
app.use('/api/chat', chatRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err)
  res.status(500).json({ error: 'Internal server error' })
})

// ── Socket.io Authentication ─────────────────────────
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token

    if (!token) {
      return next(new Error('No token provided'))
    }

    const user = await verifySocketToken(token)
    socket.user = user

    next()
  } catch (err) {
    console.error('[Socket Auth Error]', err.message)
    next(new Error('Socket authentication failed'))
  }
})

// ── Initialize Realtime System ───────────────────────
new SessionSocket(io)
new ChatSocket(io)

// ── Start Server ─────────────────────────────────────
const PORT = process.env.PORT || 4000

httpServer.listen(PORT, () => {
  console.log(`\n─────────────────────────────────────`)
  console.log(`  Server:   http://localhost:${PORT}`)
  console.log(`  Health:   http://localhost:${PORT}/health`)
  console.log(`  Auth:     http://localhost:${PORT}/api/auth`)
  console.log(`  Sessions: http://localhost:${PORT}/api/sessions`)
  console.log(`  Realtime: Socket.io ready 🚀`)
  console.log(`─────────────────────────────────────\n`)
})