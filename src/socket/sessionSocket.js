class SessionSocket {
  constructor(io) {
    this.io = io;
    this.sessions = new Map();
    this.setupEvents();
  }

  setupEvents() {
    this.io.on('connection', (socket) => {
      console.log('🔌 Socket connected:', socket.id);

      socket.on('join-room', ({ sessionId, userId, username }) => {
        if (socket.sessionId) return;

        socket.join(sessionId);
        socket.sessionId = sessionId;

        if (!this.sessions.has(sessionId)) {
          this.sessions.set(sessionId, {
            code: '// Welcome to CodeCollab! 🚀',
            language: 'javascript',
            users: new Map()
          });
        }

        const session = this.sessions.get(sessionId);

        // limit users
        if (session.users.size >= 2) {
          socket.emit('error', 'Session full');
          return;
        }

        session.users.set(socket.id, {
          socketId: socket.id,
          userId,
          username
        });

        socket.emit('init', {
          code: session.code,
          language: session.language,
          users: Array.from(session.users.values())
        });

        socket.to(sessionId).emit('user-joined', { userId, username });
        this.io.to(sessionId).emit('users-update', Array.from(session.users.values()));

        const throttledCodeUpdate = this.throttle((code) => {
          const session = this.sessions.get(socket.sessionId);
          if (!session) return;

          session.code = code;
          socket.to(socket.sessionId).emit('code-update', code);
        }, 150);

        socket.on('code-change', throttledCodeUpdate);

        socket.on('disconnect', () => {
          const session = this.sessions.get(socket.sessionId);
          if (!session) return;

          session.users.delete(socket.id);

          socket.to(socket.sessionId).emit('user-left', socket.id);
          this.io.to(socket.sessionId).emit('users-update', Array.from(session.users.values()));

          if (session.users.size === 0) {
            this.sessions.delete(socket.sessionId);
          }
        });
      });
    });
  }

  throttle(func, limit) {
    let lastCall = 0;
    return (...args) => {
      const now = Date.now();
      if (now - lastCall >= limit) {
        lastCall = now;
        return func(...args);
      }
    };
  }
}

module.exports = SessionSocket;