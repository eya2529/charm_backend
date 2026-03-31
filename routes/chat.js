import express from 'express';
import { GeminiService } from '../services/geminiService.js';
import { StorageService } from '../services/storageService.js';

const router = express.Router();

// Create new conversation
router.post('/conversation', async (req, res) => {
  try {
    const { title, mode = 'stylist' } = req.body;
    
    const conversation = await StorageService.createConversation(title, mode);
    
    res.json({
      success: true,
      conversation: conversation
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create conversation',
      details: error.message
    });
  }
});

// Send message to existing conversation
router.post('/message', async (req, res) => {
  try {
    const { 
      message, 
      mode = 'stylist', 
      conversationId,
      createNew = false 
    } = req.body;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }
    
    let activeConversationId = conversationId;
    let conversation;
    
    // Create new conversation if requested or no conversation ID provided
    if (createNew || !activeConversationId) {
      conversation = await StorageService.createConversation(
        message.substring(0, 30) + (message.length > 30 ? '...' : ''),
        mode
      );
      activeConversationId = conversation.id;
      console.log(`✨ Created new conversation: ${activeConversationId}`);
    } else {
      // Get existing conversation
      conversation = await StorageService.getConversation(activeConversationId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found'
        });
      }
      console.log(`📝 Using existing conversation: ${activeConversationId}`);
    }
    
    console.log(`📨 Message to conversation ${activeConversationId}: "${message.substring(0, 50)}..."`);
    
    // Get conversation history for context
    const history = await StorageService.getConversationContext(activeConversationId, 10);
    
    // Get text response from AI
    console.log('💬 Generating text response...');
    const textResponse = await GeminiService.textGeneration(message, mode, history);
    
    // Create message objects
    const userMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: message,
      sender: 'user',
      timestamp: new Date().toISOString(),
      mode: mode
    };
    
    const charmResponse = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: textResponse,
      sender: 'charm',
      timestamp: new Date().toISOString(),
      mode: mode,
      inResponseTo: userMessage.id
    };
    
    // Save messages to conversation
    const updatedConversation = await StorageService.addMessage(
      activeConversationId,
      userMessage,
      charmResponse
    );
    
    console.log(`💾 Messages saved to conversation: ${activeConversationId}`);
    
    res.json({
      success: true,
      response: charmResponse,
      conversation: {
        id: updatedConversation.id,
        title: updatedConversation.title,
        mode: updatedConversation.mode,
        messageCount: updatedConversation.messageCount
      }
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process message',
      details: error.message
    });
  }
});

// Get all conversations
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await StorageService.getConversations();
    
    // Format conversations for display
    const formattedConversations = conversations.map(conv => ({
      id: conv.id,
      title: conv.title || 'Untitled Conversation',
      mode: conv.mode || 'stylist',
      messageCount: conv.messages?.length || 0,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      preview: conv.messages && conv.messages.length > 0 
        ? (conv.messages[conv.messages.length - 1]?.text?.substring(0, 100) || 'No preview')
        : 'Empty conversation'
    }));
    
    res.json({
      success: true,
      conversations: formattedConversations,
      total: formattedConversations.length
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversations',
      details: error.message
    });
  }
});

// Get single conversation with all messages
router.get('/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = await StorageService.getConversation(id);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }
    
    res.json({
      success: true,
      conversation: conversation
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversation',
      details: error.message
    });
  }
});

// Update conversation title
router.put('/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    
    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }
    
    const conversation = await StorageService.updateConversationTitle(id, title);
    
    res.json({
      success: true,
      conversation: conversation
    });
  } catch (error) {
    console.error('Error updating conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update conversation title',
      details: error.message
    });
  }
});

// Delete conversation
router.delete('/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await StorageService.deleteConversation(id);
    
    res.json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete conversation',
      details: error.message
    });
  }
});

// Clear all conversations
router.delete('/conversations', async (req, res) => {
  try {
    await StorageService.clearAllConversations();
    
    res.json({
      success: true,
      message: 'All conversations cleared'
    });
  } catch (error) {
    console.error('Error clearing conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear conversations',
      details: error.message
    });
  }
});

export default router;