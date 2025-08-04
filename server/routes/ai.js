const express = require('express');
const router = express.Router();

// Import models and services
const Result = require('../models/Result');
const Stream = require('../models/Stream');
const AIService = require('../services/AIService');

// GET /api/ai/models - Get available AI models
router.get('/models', async (req, res) => {
  try {
    const models = await AIService.getAvailableModels();
    
    res.json({
      success: true,
      data: models
    });
  } catch (error) {
    console.error('Error fetching AI models:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI models',
      message: error.message
    });
  }
});

// POST /api/ai/process - Process stream with AI model
router.post('/process', async (req, res) => {
  try {
    const { streamId, modelType, parameters } = req.body;
    
    if (!streamId || !modelType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: streamId, modelType'
      });
    }
    
    // Check if stream exists
    const stream = await Stream.findById(streamId);
    if (!stream) {
      return res.status(404).json({
        success: false,
        error: 'Stream not found'
      });
    }
    
    // Process stream with AI
    const result = await AIService.processStream(streamId, modelType, parameters);
    
    res.json({
      success: true,
      data: result,
      message: 'AI processing completed successfully'
    });
  } catch (error) {
    console.error('Error processing AI:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process AI',
      message: error.message
    });
  }
});

// GET /api/ai/results - Get AI results
router.get('/results', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      streamId, 
      modelType, 
      startDate, 
      endDate,
      confidence,
      status 
    } = req.query;
    
    let query = {};
    
    // Filter by stream
    if (streamId) {
      query.streamId = streamId;
    }
    
    // Filter by model type
    if (modelType) {
      query.modelType = modelType;
    }
    
    // Filter by date range
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    // Filter by confidence
    if (confidence) {
      query.confidence = { $gte: parseFloat(confidence) };
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { timestamp: -1 },
      populate: {
        path: 'streamId',
        select: 'name status'
      }
    };
    
    const results = await Result.paginate(query, options);
    
    res.json({
      success: true,
      data: results.docs,
      pagination: {
        page: results.page,
        limit: results.limit,
        totalPages: results.totalPages,
        totalDocs: results.totalDocs,
        hasNextPage: results.hasNextPage,
        hasPrevPage: results.hasPrevPage
      }
    });
  } catch (error) {
    console.error('Error fetching AI results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI results',
      message: error.message
    });
  }
});

// GET /api/ai/results/:id - Get specific AI result
router.get('/results/:id', async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('streamId', 'name status source');
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'AI result not found'
      });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching AI result:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI result',
      message: error.message
    });
  }
});

// DELETE /api/ai/results/:id - Delete AI result
router.delete('/results/:id', async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'AI result not found'
      });
    }
    
    await Result.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'AI result deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting AI result:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete AI result',
      message: error.message
    });
  }
});

// GET /api/ai/statistics - Get AI processing statistics
router.get('/statistics', async (req, res) => {
  try {
    const { timeRange = 24 } = req.query;
    
    const statistics = await Result.getModelPerformance(parseInt(timeRange));
    
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Error fetching AI statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI statistics',
      message: error.message
    });
  }
});

// GET /api/ai/statistics/:streamId - Get AI statistics for specific stream
router.get('/statistics/:streamId', async (req, res) => {
  try {
    const { streamId } = req.params;
    const { timeRange = 24 } = req.query;
    
    // Check if stream exists
    const stream = await Stream.findById(streamId);
    if (!stream) {
      return res.status(404).json({
        success: false,
        error: 'Stream not found'
      });
    }
    
    const statistics = await Result.getDetectionStatistics(streamId, parseInt(timeRange));
    
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Error fetching stream AI statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stream AI statistics',
      message: error.message
    });
  }
});

// POST /api/ai/batch-process - Batch process multiple streams
router.post('/batch-process', async (req, res) => {
  try {
    const { streamIds, modelType, parameters } = req.body;
    
    if (!streamIds || !Array.isArray(streamIds) || streamIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'streamIds must be a non-empty array'
      });
    }
    
    if (!modelType) {
      return res.status(400).json({
        success: false,
        error: 'modelType is required'
      });
    }
    
    // Process streams in batch
    const results = await AIService.batchProcessStreams(streamIds, modelType, parameters);
    
    res.json({
      success: true,
      data: results,
      message: `Batch processing completed for ${results.length} streams`
    });
  } catch (error) {
    console.error('Error batch processing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to batch process streams',
      message: error.message
    });
  }
});

// GET /api/ai/high-confidence - Get high confidence detections
router.get('/high-confidence', async (req, res) => {
  try {
    const { confidence = 0.8, limit = 50 } = req.query;
    
    const detections = await Result.getHighConfidenceDetections(
      parseFloat(confidence),
      parseInt(limit)
    );
    
    res.json({
      success: true,
      data: detections
    });
  } catch (error) {
    console.error('Error fetching high confidence detections:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch high confidence detections',
      message: error.message
    });
  }
});

// POST /api/ai/cleanup - Clean up old AI results
router.post('/cleanup', async (req, res) => {
  try {
    const { daysToKeep = 30 } = req.body;
    
    const result = await Result.cleanOldResults(parseInt(daysToKeep));
    
    res.json({
      success: true,
      message: `Cleaned up AI results older than ${daysToKeep} days`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up AI results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clean up AI results',
      message: error.message
    });
  }
});

// GET /api/ai/stream/:streamId/detections - Get detections for a stream
router.get('/stream/:streamId/detections', async (req, res) => {
  try {
    const { streamId } = req.params;
    const { limit = 100, modelType } = req.query;
    
    // Check if stream exists
    const stream = await Stream.findById(streamId);
    if (!stream) {
      return res.status(404).json({
        success: false,
        error: 'Stream not found'
      });
    }
    
    let query = { streamId };
    if (modelType) {
      query.modelType = modelType;
    }
    
    const results = await Result.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .select('detections timestamp modelType confidence');
    
    // Extract and flatten detections
    const detections = results.reduce((acc, result) => {
      result.detections.forEach(detection => {
        acc.push({
          ...detection.toObject(),
          timestamp: result.timestamp,
          modelType: result.modelType,
          resultConfidence: result.confidence
        });
      });
      return acc;
    }, []);
    
    res.json({
      success: true,
      data: detections
    });
  } catch (error) {
    console.error('Error fetching stream detections:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stream detections',
      message: error.message
    });
  }
});

// POST /api/ai/stream/:streamId/process - Process specific stream
router.post('/stream/:streamId/process', async (req, res) => {
  try {
    const { streamId } = req.params;
    const { modelType, parameters } = req.body;
    
    // Check if stream exists
    const stream = await Stream.findById(streamId);
    if (!stream) {
      return res.status(404).json({
        success: false,
        error: 'Stream not found'
      });
    }
    
    // Process stream
    const result = await AIService.processStream(streamId, modelType, parameters);
    
    res.json({
      success: true,
      data: result,
      message: 'Stream processed successfully'
    });
  } catch (error) {
    console.error('Error processing stream:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process stream',
      message: error.message
    });
  }
});

module.exports = router; 