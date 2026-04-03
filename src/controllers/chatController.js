const { supabaseAdmin } = require('../config/supabase')
console.log("SUPABASE TYPE:", typeof supabaseAdmin)
console.log("🔥 USING ADMIN:", supabaseAdmin?.from ? "YES" : "NO")

// 📩 SEND MESSAGE
const sendMessage = async (req, res) => {
  const { sessionId, message } = req.body;
  const user = req.user;

  try {
    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .insert([{
        session_id: sessionId,
        user_id: user.id,
        username: user.username,
        message
      }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.json(data);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📥 GET MESSAGES
const getMessages = async (req, res) => {
    console.log("🔥 getMessages HIT")
  console.log("SUPABASE TYPE:", typeof supabaseAdmin)
  console.log("🔥 USING ADMIN:", supabaseAdmin?.from ? "YES" : "NO")

  const { sessionId } = req.params;
  const { limit = 50 } = req.query;

 try {
  const { data, error } = await supabaseAdmin
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error("❌ SUPABASE ERROR:", error);   // 👈 ADD THIS
    return res.status(400).json({ error: error.message });
  }

  console.log("✅ CHAT DATA:", data); // 👈 ADD THIS

  res.json(data || []);
} catch (error) {
  console.error("🔥 SERVER ERROR:", error); // 👈 ADD THIS
  res.status(500).json({ error: error.message });
}
};

module.exports = { sendMessage, getMessages };