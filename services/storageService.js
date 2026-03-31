import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure directories exist
const ensureDirectories = async () => {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Initialize JSON files if they don't exist
    const files = ['conversations.json', 'favorites.json', 'uploads.json'];
    for (const file of files) {
      const filePath = path.join(DATA_DIR, file);
      try {
        await fs.access(filePath);
      } catch {
        // File doesn't exist, create it with empty array
        await fs.writeFile(filePath, JSON.stringify([], null, 2));
        console.log(`Created data file: ${file}`);
      }
    }
  } catch (error) {
    console.error('Error creating directories:', error);
    throw error;
  }
};

export const StorageService = {
  // ========== CONVERSATION MANAGEMENT ==========
  
  // Create a new conversation
  async createConversation(title = 'New Conversation', mode = 'stylist') {
    try {
      const filePath = path.join(DATA_DIR, 'conversations.json');
      let conversations = await this.readJSON(filePath);
      
      const newConversation = {
        id: uuidv4(),
        title: title,
        mode: mode,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messageCount: 0
      };
      
      conversations.push(newConversation);
      await this.writeJSON(filePath, conversations);
      
      console.log(`📝 Created new conversation: ${newConversation.id}`);
      return newConversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  },
  
  // Get all conversations
  async getConversations() {
    try {
      const filePath = path.join(DATA_DIR, 'conversations.json');
      const conversations = await this.readJSON(filePath);
      
      // Sort by updatedAt descending (most recent first)
      return conversations.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt);
        const dateB = new Date(b.updatedAt || b.createdAt);
        return dateB - dateA;
      });
    } catch (error) {
      console.error('Error getting conversations:', error);
      return [];
    }
  },
  
  // Get a single conversation by ID
  async getConversation(conversationId) {
    try {
      const filePath = path.join(DATA_DIR, 'conversations.json');
      const conversations = await this.readJSON(filePath);
      return conversations.find(conv => conv.id === conversationId) || null;
    } catch (error) {
      console.error('Error getting conversation:', error);
      return null;
    }
  },
  
  // Add message to conversation
  async addMessage(conversationId, userMessage, charmResponse) {
    try {
      const filePath = path.join(DATA_DIR, 'conversations.json');
      let conversations = await this.readJSON(filePath);
      
      const conversationIndex = conversations.findIndex(conv => conv.id === conversationId);
      
      if (conversationIndex === -1) {
        throw new Error(`Conversation ${conversationId} not found`);
      }
      
      // Initialize messages array if it doesn't exist
      if (!conversations[conversationIndex].messages) {
        conversations[conversationIndex].messages = [];
      }
      
      // Add messages
      conversations[conversationIndex].messages.push(userMessage);
      conversations[conversationIndex].messages.push(charmResponse);
      conversations[conversationIndex].updatedAt = new Date().toISOString();
      conversations[conversationIndex].messageCount = conversations[conversationIndex].messages.length;
      
      // Update title based on first message if it's the default title
      if (conversations[conversationIndex].title === 'New Conversation' && 
          conversations[conversationIndex].messageCount === 2) {
        const firstMessage = userMessage.text.substring(0, 30);
        conversations[conversationIndex].title = firstMessage + (firstMessage.length === 30 ? '...' : '');
      }
      
      await this.writeJSON(filePath, conversations);
      
      return conversations[conversationIndex];
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  },
  
  // Update conversation title
  async updateConversationTitle(conversationId, title) {
    try {
      const filePath = path.join(DATA_DIR, 'conversations.json');
      let conversations = await this.readJSON(filePath);
      
      const conversationIndex = conversations.findIndex(conv => conv.id === conversationId);
      
      if (conversationIndex === -1) {
        throw new Error(`Conversation ${conversationId} not found`);
      }
      
      conversations[conversationIndex].title = title;
      conversations[conversationIndex].updatedAt = new Date().toISOString();
      
      await this.writeJSON(filePath, conversations);
      
      return conversations[conversationIndex];
    } catch (error) {
      console.error('Error updating conversation title:', error);
      throw error;
    }
  },
  
  // Delete a conversation
  async deleteConversation(conversationId) {
    try {
      const filePath = path.join(DATA_DIR, 'conversations.json');
      let conversations = await this.readJSON(filePath);
      const initialLength = conversations.length;
      
      conversations = conversations.filter(conv => conv.id !== conversationId);
      
      if (conversations.length === initialLength) {
        throw new Error(`Conversation ${conversationId} not found`);
      }
      
      await this.writeJSON(filePath, conversations);
      console.log(`🗑️ Deleted conversation: ${conversationId}`);
      
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  },
  
  // Clear all conversations
  async clearAllConversations() {
    try {
      const filePath = path.join(DATA_DIR, 'conversations.json');
      await this.writeJSON(filePath, []);
      console.log('🗑️ All conversations cleared');
      return true;
    } catch (error) {
      console.error('Error clearing conversations:', error);
      throw error;
    }
  },
  
  // Get conversation history for context (last N messages)
  async getConversationContext(conversationId, limit = 10) {
    try {
      const conversation = await this.getConversation(conversationId);
      
      if (!conversation || !conversation.messages) {
        return [];
      }
      
      // Return last N messages for context
      return conversation.messages.slice(-limit).map(msg => ({
        sender: msg.sender,
        text: msg.text,
        timestamp: msg.timestamp
      }));
    } catch (error) {
      console.error('Error getting conversation context:', error);
      return [];
    }
  },
  
  // ========== FAVORITES MANAGEMENT ==========
  
  async saveFavorite(message, conversationId) {
    try {
      const filePath = path.join(DATA_DIR, 'favorites.json');
      let favorites = await this.readJSON(filePath);
      
      const newFavorite = {
        id: uuidv4(),
        message: {
          ...message,
          conversationId: conversationId
        },
        savedAt: new Date().toISOString()
      };
      
      favorites.push(newFavorite);
      await this.writeJSON(filePath, favorites);
      
      console.log(`❤️ Favorite saved: ${newFavorite.id}`);
      return newFavorite;
    } catch (error) {
      console.error('Error saving favorite:', error);
      throw error;
    }
  },
  
  async getFavorites() {
    try {
      const filePath = path.join(DATA_DIR, 'favorites.json');
      const favorites = await this.readJSON(filePath);
      return favorites.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  },
  
  async deleteFavorite(id) {
    try {
      const filePath = path.join(DATA_DIR, 'favorites.json');
      let favorites = await this.readJSON(filePath);
      favorites = favorites.filter(fav => fav.id !== id);
      await this.writeJSON(filePath, favorites);
      return true;
    } catch (error) {
      console.error('Error deleting favorite:', error);
      throw error;
    }
  },
  
  async isFavorite(messageId) {
    try {
      const favorites = await this.getFavorites();
      return favorites.some(fav => fav.message.id === messageId);
    } catch (error) {
      console.error('Error checking favorite:', error);
      return false;
    }
  },
  
  // ========== UPLOADS MANAGEMENT ==========
  
  async saveUpload(uploadData) {
    try {
      const filePath = path.join(DATA_DIR, 'uploads.json');
      let uploads = await this.readJSON(filePath);
      
      const newUpload = {
        ...uploadData,
        id: uploadData.id || uuidv4(),
        uploadedAt: new Date().toISOString()
      };
      
      uploads.push(newUpload);
      await this.writeJSON(filePath, uploads);
      return newUpload;
    } catch (error) {
      console.error('Error saving upload:', error);
      throw error;
    }
  },
  
  async getUploads() {
    try {
      const filePath = path.join(DATA_DIR, 'uploads.json');
      return await this.readJSON(filePath);
    } catch (error) {
      console.error('Error getting uploads:', error);
      return [];
    }
  },
  
  async deleteUpload(id) {
    try {
      const filePath = path.join(DATA_DIR, 'uploads.json');
      let uploads = await this.readJSON(filePath);
      uploads = uploads.filter(upload => upload.id !== id);
      await this.writeJSON(filePath, uploads);
      return true;
    } catch (error) {
      console.error('Error deleting upload:', error);
      throw error;
    }
  },
  
  // ========== HELPER FUNCTIONS ==========
  
  async readJSON(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, create empty array
        await this.writeJSON(filePath, []);
        return [];
      }
      console.error('Error reading JSON:', error);
      return [];
    }
  },
  
  async writeJSON(filePath, data) {
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error writing JSON:', error);
      throw error;
    }
  }
};

// Initialize directories on import
await ensureDirectories().catch(console.error);

export default StorageService;