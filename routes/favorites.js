import express from 'express';
import { StorageService } from '../services/storageService.js';

const router = express.Router();

// Get all favorites
router.get('/', async (req, res) => {
  try {
    const favorites = await StorageService.getFavorites();
    res.json({
      success: true,
      favorites: favorites
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch favorites'
    });
  }
});

// Save favorite message
router.post('/', async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }
    
    // Check if already favorited
    const isFav = await StorageService.isFavorite(message.id);
    if (isFav) {
      return res.status(400).json({
        success: false,
        error: 'Message already in favorites'
      });
    }
    
    const favorite = await StorageService.saveFavorite(message, conversationId);
    
    res.json({
      success: true,
      favorite: favorite
    });
  } catch (error) {
    console.error('Error saving favorite:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save favorite'
    });
  }
});

// Delete favorite
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await StorageService.deleteFavorite(id);
    
    res.json({
      success: true,
      message: 'Favorite deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting favorite:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete favorite'
    });
  }
});

// Check if message is favorited
router.get('/check/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const isFavorited = await StorageService.isFavorite(messageId);
    
    res.json({
      success: true,
      isFavorited: isFavorited
    });
  } catch (error) {
    console.error('Error checking favorite:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check favorite'
    });
  }
});

export default router;