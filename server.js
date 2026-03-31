import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import chatRoutes from './routes/chat.js';
import uploadRoutes from './routes/uploads.js';
import historyRoutes from './routes/history.js';
import favoritesRoutes from './routes/favorites.js';
import { GeminiService } from './services/geminiService.js';
import { StorageService } from './services/storageService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Create necessary directories
const directories = ['uploads/images', 'uploads/files', 'data'];
directories.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created directory: ${fullPath}`);
  }
});

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize Gemini
console.log('🚀 Initializing Gemini AI Service...');
GeminiService.init();

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/favorites', favoritesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Charm Vintage AI Stylist',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      chat: '/api/chat/message',
      upload: '/api/uploads/file',
      history: '/api/history/conversations',
      favorites: '/api/favorites'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✨ Charm backend running on http://localhost:${PORT}`);
  console.log(`📁 Uploads directory: ${path.join(__dirname, 'uploads')}`);
  console.log(`💾 Data directory: ${path.join(__dirname, 'data')}`);
  console.log(`🤖 Gemini AI Status: Active`);
  console.log(`\n📡 Available endpoints:`);
  console.log(`   POST /api/chat/message - Chat with AI stylist`);
  console.log(`   POST /api/uploads/file - Upload files`);
  console.log(`   GET  /api/history/conversations - Get chat history`);
  console.log(`   GET  /api/favorites - Get favorite messages\n`);
});

export default app;