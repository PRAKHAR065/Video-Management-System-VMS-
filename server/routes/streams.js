const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Import models and services
const Stream = require('../models/Stream');
const StreamService = require('../services/StreamService');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/videos');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|avi|mov|mkv|wmv|flv|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'));
    }
  }
});

// GET /api/streams - Get all streams
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, modelType, search } = req.query;
    
    let query = {};
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by AI model type
    if (modelType) {
      query['aiModels.modelType'] = modelType;
    }
    
    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };
    
    const streams = await Stream.paginate(query, options);
    
    res.json({
      success: true,
      data: streams.docs,
      pagination: {
        page: streams.page,
        limit: streams.limit,
        totalPages: streams.totalPages,
        totalDocs: streams.totalDocs,
        hasNextPage: streams.hasNextPage,
        hasPrevPage: streams.hasPrevPage
      }
    });
  } catch (error) {
    console.error('Error fetching streams:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch streams',
      message: error.message
    });
  }
});

// GET /api/streams/:id - Get stream by ID
router.get('/:id', async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id);
    
    if (!stream) {
      return res.status(404).json({
        success: false,
        error: 'Stream not found'
      });
    }
    
    res.json({
      success: true,
      data: stream
    });
  } catch (error) {
    console.error('Error fetching stream:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stream',
      message: error.message
    });
  }
});

// POST /api/streams - Create new stream
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      source,
      aiModels,
      settings,
      metadata
    } = req.body;
    
    // Validate required fields
    if (!name || !source || !source.type || !source.url) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, source.type, source.url'
      });
    }
    
    // Create stream
    const stream = new Stream({
      name,
      description,
      source,
      aiModels: aiModels || [],
      settings: settings || {},
      metadata: metadata || {}
    });
    
    await stream.save();
    
    // Initialize stream processing
    await StreamService.initializeStream(stream._id);
    
    res.status(201).json({
      success: true,
      data: stream,
      message: 'Stream created successfully'
    });
  } catch (error) {
    console.error('Error creating stream:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create stream',
      message: error.message
    });
  }
});

// PUT /api/streams/:id - Update stream
router.put('/:id', async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id);
    
    if (!stream) {
      return res.status(404).json({
        success: false,
        error: 'Stream not found'
      });
    }
    
    // Update fields
    const updateFields = ['name', 'description', 'source', 'aiModels', 'settings', 'metadata'];
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        stream[field] = req.body[field];
      }
    });
    
    await stream.save();
    
    // Update stream processing if needed
    await StreamService.updateStream(stream._id);
    
    res.json({
      success: true,
      data: stream,
      message: 'Stream updated successfully'
    });
  } catch (error) {
    console.error('Error updating stream:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update stream',
      message: error.message
    });
  }
});

// DELETE /api/streams/:id - Delete stream
router.delete('/:id', async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id);
    
    if (!stream) {
      return res.status(404).json({
        success: false,
        error: 'Stream not found'
      });
    }
    
    // Stop stream processing
    await StreamService.stopStream(stream._id);
    
    // Delete stream
    await Stream.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Stream deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting stream:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete stream',
      message: error.message
    });
  }
});

// POST /api/streams/:id/start - Start stream
router.post('/:id/start', async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id);
    
    if (!stream) {
      return res.status(404).json({
        success: false,
        error: 'Stream not found'
      });
    }
    
    await StreamService.startStream(stream._id);
    
    res.json({
      success: true,
      message: 'Stream started successfully'
    });
  } catch (error) {
    console.error('Error starting stream:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start stream',
      message: error.message
    });
  }
});

// POST /api/streams/:id/stop - Stop stream
router.post('/:id/stop', async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id);
    
    if (!stream) {
      return res.status(404).json({
        success: false,
        error: 'Stream not found'
      });
    }
    
    await StreamService.stopStream(stream._id);
    
    res.json({
      success: true,
      message: 'Stream stopped successfully'
    });
  } catch (error) {
    console.error('Error stopping stream:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop stream',
      message: error.message
    });
  }
});

// POST /api/streams/:id/restart - Restart stream
router.post('/:id/restart', async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id);
    
    if (!stream) {
      return res.status(404).json({
        success: false,
        error: 'Stream not found'
      });
    }
    
    await StreamService.restartStream(stream._id);
    
    res.json({
      success: true,
      message: 'Stream restarted successfully'
    });
  } catch (error) {
    console.error('Error restarting stream:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to restart stream',
      message: error.message
    });
  }
});

// POST /api/streams/upload - Upload video file
router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No video file uploaded'
      });
    }
    
    const { name, description, aiModels, settings, metadata } = req.body;
    
    // Create stream from uploaded file
    const stream = new Stream({
      name: name || `Uploaded Video - ${req.file.originalname}`,
      description: description || 'Video uploaded from file',
      source: {
        type: 'file',
        url: `/uploads/videos/${req.file.filename}`
      },
      aiModels: aiModels ? JSON.parse(aiModels) : [],
      settings: settings ? JSON.parse(settings) : {},
      metadata: metadata ? JSON.parse(metadata) : {}
    });
    
    await stream.save();
    
    // Initialize stream processing
    await StreamService.initializeStream(stream._id);
    
    res.status(201).json({
      success: true,
      data: stream,
      message: 'Video uploaded and stream created successfully'
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload video',
      message: error.message
    });
  }
});

// GET /api/streams/:id/statistics - Get stream statistics
router.get('/:id/statistics', async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id);
    
    if (!stream) {
      return res.status(404).json({
        success: false,
        error: 'Stream not found'
      });
    }
    
    const statistics = await StreamService.getStreamStatistics(stream._id);
    
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Error fetching stream statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stream statistics',
      message: error.message
    });
  }
});

// POST /api/streams/:id/reset-statistics - Reset stream statistics
router.post('/:id/reset-statistics', async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id);
    
    if (!stream) {
      return res.status(404).json({
        success: false,
        error: 'Stream not found'
      });
    }
    
    await stream.resetStatistics();
    
    res.json({
      success: true,
      message: 'Stream statistics reset successfully'
    });
  } catch (error) {
    console.error('Error resetting stream statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset stream statistics',
      message: error.message
    });
  }
});

// GET /api/streams/statistics/overview - Get overall statistics
router.get('/statistics/overview', async (req, res) => {
  try {
    const statistics = await Stream.getStreamStatistics();
    
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Error fetching overview statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch overview statistics',
      message: error.message
    });
  }
});

module.exports = router; 