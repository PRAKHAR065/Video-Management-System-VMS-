const express = require('express');
const router = express.Router();

// Import models and services
const Alert = require('../models/Alert');
const Stream = require('../models/Stream');
const AlertService = require('../services/AlertService');

// GET /api/alerts - Get all alerts
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      type, 
      severity, 
      streamId,
      startDate, 
      endDate,
      search 
    } = req.query;
    
    let query = {};
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by type
    if (type) {
      query.type = type;
    }
    
    // Filter by severity
    if (severity) {
      query.severity = severity;
    }
    
    // Filter by stream
    if (streamId) {
      query.streamId = streamId;
    }
    
    // Filter by date range
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    // Search by title or message
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
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
    
    const alerts = await Alert.paginate(query, options);
    
    res.json({
      success: true,
      data: alerts.docs,
      pagination: {
        page: alerts.page,
        limit: alerts.limit,
        totalPages: alerts.totalPages,
        totalDocs: alerts.totalDocs,
        hasNextPage: alerts.hasNextPage,
        hasPrevPage: alerts.hasPrevPage
      }
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts',
      message: error.message
    });
  }
});

// GET /api/alerts/active - Get active alerts
router.get('/active', async (req, res) => {
  try {
    const alerts = await Alert.getActiveAlerts();
    
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Error fetching active alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active alerts',
      message: error.message
    });
  }
});

// GET /api/alerts/critical - Get critical alerts
router.get('/critical', async (req, res) => {
  try {
    const alerts = await Alert.getCriticalAlerts();
    
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Error fetching critical alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch critical alerts',
      message: error.message
    });
  }
});

// GET /api/alerts/:id - Get alert by ID
router.get('/:id', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate('streamId', 'name status source');
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }
    
    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    console.error('Error fetching alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alert',
      message: error.message
    });
  }
});

// POST /api/alerts - Create new alert
router.post('/', async (req, res) => {
  try {
    const {
      streamId,
      type,
      category,
      title,
      message,
      severity,
      data,
      location,
      tags
    } = req.body;
    
    // Validate required fields
    if (!streamId || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: streamId, type, title, message'
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
    
    // Create alert
    const alert = new Alert({
      streamId,
      type,
      category: category || 'system',
      title,
      message,
      severity: severity || 'medium',
      data: data || {},
      location: location || {},
      tags: tags || []
    });
    
    await alert.save();
    
    res.status(201).json({
      success: true,
      data: alert,
      message: 'Alert created successfully'
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create alert',
      message: error.message
    });
  }
});

// PUT /api/alerts/:id - Update alert
router.put('/:id', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }
    
    // Update fields
    const updateFields = ['title', 'message', 'severity', 'data', 'location', 'tags'];
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        alert[field] = req.body[field];
      }
    });
    
    await alert.save();
    
    res.json({
      success: true,
      data: alert,
      message: 'Alert updated successfully'
    });
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update alert',
      message: error.message
    });
  }
});

// DELETE /api/alerts/:id - Delete alert
router.delete('/:id', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }
    
    await Alert.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete alert',
      message: error.message
    });
  }
});

// POST /api/alerts/:id/acknowledge - Acknowledge alert
router.post('/:id/acknowledge', async (req, res) => {
  try {
    const { acknowledgedBy } = req.body;
    const alert = await Alert.findById(req.params.id);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }
    
    await alert.acknowledge(acknowledgedBy || 'system');
    
    res.json({
      success: true,
      data: alert,
      message: 'Alert acknowledged successfully'
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to acknowledge alert',
      message: error.message
    });
  }
});

// POST /api/alerts/:id/resolve - Resolve alert
router.post('/:id/resolve', async (req, res) => {
  try {
    const { resolvedBy } = req.body;
    const alert = await Alert.findById(req.params.id);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }
    
    await alert.resolve(resolvedBy || 'system');
    
    res.json({
      success: true,
      data: alert,
      message: 'Alert resolved successfully'
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve alert',
      message: error.message
    });
  }
});

// POST /api/alerts/:id/dismiss - Dismiss alert
router.post('/:id/dismiss', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }
    
    await alert.dismiss();
    
    res.json({
      success: true,
      data: alert,
      message: 'Alert dismissed successfully'
    });
  } catch (error) {
    console.error('Error dismissing alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to dismiss alert',
      message: error.message
    });
  }
});

// GET /api/alerts/stream/:streamId - Get alerts by stream
router.get('/stream/:streamId', async (req, res) => {
  try {
    const { streamId } = req.params;
    const { limit = 50 } = req.query;
    
    // Check if stream exists
    const stream = await Stream.findById(streamId);
    if (!stream) {
      return res.status(404).json({
        success: false,
        error: 'Stream not found'
      });
    }
    
    const alerts = await Alert.getAlertsByStream(streamId)
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Error fetching stream alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stream alerts',
      message: error.message
    });
  }
});

// GET /api/alerts/statistics - Get alert statistics
router.get('/statistics/overview', async (req, res) => {
  try {
    const statistics = await Alert.getAlertStatistics();
    
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Error fetching alert statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alert statistics',
      message: error.message
    });
  }
});

// POST /api/alerts/cleanup - Clean up expired alerts
router.post('/cleanup', async (req, res) => {
  try {
    const result = await Alert.cleanExpiredAlerts();
    
    res.json({
      success: true,
      message: 'Expired alerts cleaned up successfully',
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error cleaning up alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clean up alerts',
      message: error.message
    });
  }
});

// POST /api/alerts/bulk-acknowledge - Bulk acknowledge alerts
router.post('/bulk-acknowledge', async (req, res) => {
  try {
    const { alertIds, acknowledgedBy } = req.body;
    
    if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'alertIds must be a non-empty array'
      });
    }
    
    const result = await Alert.updateMany(
      { _id: { $in: alertIds } },
      {
        $set: {
          status: 'acknowledged',
          acknowledgedAt: new Date(),
          acknowledgedBy: acknowledgedBy || 'system'
        }
      }
    );
    
    res.json({
      success: true,
      message: `${result.modifiedCount} alerts acknowledged successfully`
    });
  } catch (error) {
    console.error('Error bulk acknowledging alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk acknowledge alerts',
      message: error.message
    });
  }
});

// POST /api/alerts/bulk-resolve - Bulk resolve alerts
router.post('/bulk-resolve', async (req, res) => {
  try {
    const { alertIds, resolvedBy } = req.body;
    
    if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'alertIds must be a non-empty array'
      });
    }
    
    const result = await Alert.updateMany(
      { _id: { $in: alertIds } },
      {
        $set: {
          status: 'resolved',
          resolvedAt: new Date(),
          resolvedBy: resolvedBy || 'system'
        }
      }
    );
    
    res.json({
      success: true,
      message: `${result.modifiedCount} alerts resolved successfully`
    });
  } catch (error) {
    console.error('Error bulk resolving alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk resolve alerts',
      message: error.message
    });
  }
});

module.exports = router; 