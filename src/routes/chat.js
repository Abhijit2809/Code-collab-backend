const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/authMiddleware');
const { sendMessage, getMessages } = require('../controllers/chatController');

// Protect all routes
router.use(requireAuth);

// 📩 Send message
router.post('/', sendMessage);

// 📥 Get messages for session
router.get('/session/:sessionId', getMessages);

module.exports = router;