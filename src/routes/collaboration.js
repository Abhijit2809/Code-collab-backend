const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { supabaseAdmin } = require('../config/supabase');

const router = express.Router();

router.use(requireAuth);

// GET session details
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('is_active', true)
      .maybeSingle(); // ✅ safer

    if (error) {
      console.log("SESSION FETCH ERROR:", error);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // 🔒 Optional: access control
    // if (data.created_by !== req.user.id) {
    //   return res.status(403).json({ error: 'Access denied' });
    // }

    res.json(data);

  } catch (err) {
    console.error("COLLAB ROUTE ERROR:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;