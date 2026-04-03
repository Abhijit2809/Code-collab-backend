const { supabaseAdmin } = require('../config/supabase')

// ✅ requireAuth
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.replace('Bearer ', '')

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    req.user = {
      id: user.id,
      email: user.email,
      role: profile?.role,
      full_name: profile?.full_name
    }

    next()
  } catch (err) {
    res.status(500).json({ error: 'Authentication error' })
  }
}

// ✅ requireRole
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' })

    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Access denied' })
    }

    next()
  }
}

// ✅ verifySocketToken (🔥 IMPORTANT)
async function verifySocketToken(token) {
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

  if (error || !user) {
    throw new Error('Invalid socket token')
  }

  return {
    id: user.id,
    email: user.email
  }
}

// ✅ EXPORT EVERYTHING
module.exports = {
  requireAuth,
  requireRole,
  verifySocketToken
}