import express from 'express';
import { StorageService } from '../services/storageService.js';

const router = express.Router();

// This route now redirects to chat routes for consistency
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await StorageService.getConversations();
    res.json({
      success: true,
      conversations: conversations
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversations'
    });
  }
});

export default router;