const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  streamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stream',
    required: true
  },
  type: {
    type: String,
    enum: ['detection', 'error', 'warning', 'info', 'critical'],
    required: true
  },
  category: {
    type: String,
    enum: ['object-detection', 'defect-analysis', 'motion-detection', 'system', 'network', 'ai-model'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'resolved', 'dismissed'],
    default: 'active'
  },
  data: {
    // AI detection results
    detections: [{
      label: String,
      confidence: Number,
      bbox: {
        x: Number,
        y: Number,
        width: Number,
        height: Number
      },
      timestamp: Date
    }],
    // System information
    systemInfo: {
      cpu: Number,
      memory: Number,
      disk: Number,
      network: Number
    },
    // Error details
    error: {
      code: String,
      message: String,
      stack: String
    },
    // Custom data
    metadata: mongoose.Schema.Types.Mixed
  },
  location: {
    coordinates: {
      x: Number,
      y: Number
    },
    area: String,
    zone: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  acknowledgedAt: Date,
  acknowledgedBy: {
    type: String,
    trim: true
  },
  resolvedAt: Date,
  resolvedBy: {
    type: String,
    trim: true
  },
  expiresAt: Date,
  tags: [String],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
alertSchema.index({ streamId: 1 });
alertSchema.index({ status: 1 });
alertSchema.index({ type: 1 });
alertSchema.index({ severity: 1 });
alertSchema.index({ timestamp: -1 });
alertSchema.index({ expiresAt: 1 });

// Pre-save middleware
alertSchema.pre('save', function(next) {
  // Set default expiration for non-critical alerts (24 hours)
  if (!this.expiresAt && this.severity !== 'critical') {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  
  // Set critical alerts to never expire
  if (this.severity === 'critical') {
    this.expiresAt = null;
  }
  
  next();
});

// Instance method to acknowledge alert
alertSchema.methods.acknowledge = function(acknowledgedBy) {
  this.status = 'acknowledged';
  this.acknowledgedAt = new Date();
  this.acknowledgedBy = acknowledgedBy;
  return this.save();
};

// Instance method to resolve alert
alertSchema.methods.resolve = function(resolvedBy) {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  this.resolvedBy = resolvedBy;
  return this.save();
};

// Instance method to dismiss alert
alertSchema.methods.dismiss = function() {
  this.status = 'dismissed';
  return this.save();
};

// Instance method to add detection data
alertSchema.methods.addDetection = function(detection) {
  if (!this.data.detections) {
    this.data.detections = [];
  }
  
  this.data.detections.push({
    ...detection,
    timestamp: new Date()
  });
  
  return this.save();
};

// Static method to get active alerts
alertSchema.statics.getActiveAlerts = function() {
  return this.find({
    status: 'active',
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: null }
    ]
  }).populate('streamId', 'name status');
};

// Static method to get alerts by stream
alertSchema.statics.getAlertsByStream = function(streamId) {
  return this.find({ streamId }).sort({ timestamp: -1 });
};

// Static method to get alerts by type
alertSchema.statics.getAlertsByType = function(type) {
  return this.find({ type }).sort({ timestamp: -1 });
};

// Static method to get critical alerts
alertSchema.statics.getCriticalAlerts = function() {
  return this.find({
    severity: 'critical',
    status: 'active'
  }).populate('streamId', 'name status');
};

// Static method to get alert statistics
alertSchema.statics.getAlertStatistics = function() {
  return this.aggregate([
    {
      $group: {
        _id: {
          status: '$status',
          severity: '$severity'
        },
        count: { $sum: 1 }
      }
    }
  ]);
};

// Static method to clean expired alerts
alertSchema.statics.cleanExpiredAlerts = function() {
  return this.updateMany(
    {
      expiresAt: { $lt: new Date() },
      status: { $in: ['active', 'acknowledged'] }
    },
    {
      $set: { status: 'dismissed' }
    }
  );
};

// Static method to create detection alert
alertSchema.statics.createDetectionAlert = function(streamId, detections, modelType) {
  const alert = new this({
    streamId,
    type: 'detection',
    category: modelType,
    title: `${detections.length} objects detected`,
    message: `AI model detected ${detections.length} objects in stream`,
    severity: detections.length > 5 ? 'high' : 'medium',
    data: {
      detections: detections.map(detection => ({
        ...detection,
        timestamp: new Date()
      }))
    }
  });
  
  return alert.save();
};

// Static method to create system alert
alertSchema.statics.createSystemAlert = function(streamId, type, title, message, severity = 'medium', data = {}) {
  const alert = new this({
    streamId,
    type,
    category: 'system',
    title,
    message,
    severity,
    data
  });
  
  return alert.save();
};

module.exports = mongoose.model('Alert', alertSchema); 