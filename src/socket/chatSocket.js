const { supabaseAdmin } = require('../config/supabase')
const { verifySocketToken } = require('../middleware/authMiddleware')

class ChatSocket {
  constructor(io) {
    this.io = io
    this.supabase = supabaseAdmin

    // ✅ STORE SESSION TIMERS (IMPORTANT)
    this.sessionTimers = {}

    /* ───────── AUTH MIDDLEWARE ───────── */
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token

        if (!token) {
          return next(new Error("No token"))
        }

        const user = await verifySocketToken(token)

        socket.user = {
          id: user.id,
          username: user.email
        }

        console.log("✅ SOCKET AUTH:", socket.user)

        next()
      } catch (err) {
        console.log("❌ AUTH ERROR:", err.message)
        next(new Error("Unauthorized"))
      }
    })

    this.setupEvents()
  }

  setupEvents() {
    this.io.on('connection', (socket) => {
      console.log("🔌 Connected:", socket.id)

      /* ───────── JOIN ROOM ───────── */
      socket.on('join-room', ({ sessionId }) => {
        socket.join(sessionId)
        socket.sessionId = sessionId

        console.log("✅ USER JOINED:", socket.user)

        // notify others
        socket.to(sessionId).emit('user-joined', {
          username: socket.user.username
        })

        /* 🧨 SESSION TIMEOUT (1 hour) */
        if (!this.sessionTimers[sessionId]) {
          console.log("⏰ Starting timer for session:", sessionId)

          this.sessionTimers[sessionId] = setTimeout(() => {
            console.log("⏰ SESSION ENDED:", sessionId)

            this.io.to(sessionId).emit('session-ended')

            delete this.sessionTimers[sessionId]
          }, 60 * 60 * 1000) // 1 hour
        }
      })

      /* ───────── CHAT MESSAGE ───────── */
      socket.on('chat-message', async ({ sessionId, message }) => {
        try {
          if (!socket.user?.id) return

          const { data, error } = await this.supabase
            .from('chat_messages')
            .insert([{
              session_id: sessionId,
              user_id: socket.user.id,
              username: socket.user.username,
              message
            }])
            .select()
            .single()

          if (error) {
            console.log("❌ DB ERROR:", error)
            return
          }

          this.io.to(sessionId).emit('chat-message', data)

        } catch (err) {
          console.log("❌ CHAT ERROR:", err.message)
        }
      })

      /* ───────── VIDEO CALL SIGNALING ───────── */
      socket.on('video-offer', ({ sessionId, offer }) => {
        socket.to(sessionId).emit('video-offer', { offer })
      })

      socket.on('video-answer', ({ sessionId, answer }) => {
        socket.to(sessionId).emit('video-answer', { answer })
      })

      socket.on('ice-candidate', ({ sessionId, candidate }) => {
        socket.to(sessionId).emit('ice-candidate', { candidate })
      })

      /* ───────── DISCONNECT ───────── */
      socket.on('disconnect', () => {
        console.log("❌ Disconnected:", socket.id)

        if (socket.sessionId) {
          socket.to(socket.sessionId).emit('user-left', {
            username: socket.user?.username
          })
        }
      })
    })
  }
}

module.exports = ChatSocket