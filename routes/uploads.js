import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { StorageService } from '../services/storageService.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure upload directories exist
const ensureUploadDirs = () => {
  const dirs = [
    path.join(__dirname, '..', 'uploads'),
    path.join(__dirname, '..', 'uploads', 'images'),
    path.join(__dirname, '..', 'uploads', 'files')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
};

ensureUploadDirs();

// Configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath;
    if (file.mimetype.startsWith('image/')) {
      uploadPath = path.join(__dirname, '..', 'uploads', 'images');
    } else {
      uploadPath = path.join(__dirname, '..', 'uploads', 'files');
    }
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

// Upload single file
router.post('/file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded' 
      });
    }
    
    const fileUrl = `/uploads/${req.file.mimetype.startsWith('image/') ? 'images' : 'files'}/${req.file.filename}`;
    
    const uploadData = {
      id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      url: fileUrl,
      type: req.file.mimetype,
      size: req.file.size,
      isImage: req.file.mimetype.startsWith('image/')
    };
    
    await StorageService.saveUpload(uploadData);
    
    console.log(`✅ File uploaded: ${req.file.originalname}`);
    
    res.json({
      success: true,
      file: uploadData
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload file'
    });
  }
});

// Get all uploads
router.get('/files', async (req, res) => {
  try {
    const uploads = await StorageService.getUploads();
    res.json({
      success: true,
      uploads: uploads.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
    });
  } catch (error) {
    console.error('Error fetching uploads:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch uploads'
    });
  }
});

// Delete upload
router.delete('/files/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await StorageService.deleteUpload(id);
    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting upload:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete upload'
    });
  }
});

export default router;