const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  streamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stream',
    required: true
  },
  modelType: {
    type: String,
    enum: ['object-detection', 'defect-analysis', 'face-recognition', 'motion-detection'],
    required: true
  },
  modelVersion: {
    type: String,
    default: '1.0.0'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  frameNumber: {
    type: Number,
    required: true
  },
  processingTime: {
    type: Number, // in milliseconds
    required: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    required: true
  },
  detections: [{
    label: {
      type: String,
      required: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true
    },
    bbox: {
      x: {
        type: Number,
        required: true
      },
      y: {
        type: Number,
        required: true
      },
      width: {
        type: Number,
        required: true
      },
      height: {
        type: Number,
        required: true
      }
    },
    classId: Number,
    attributes: mongoose.Schema.Types.Mixed
  }],
  analysis: {
    // Defect analysis specific
    defects: [{
      type: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      },
      location: {
        x: Number,
        y: Number,
        width: Number,
        height: Number
      },
      description: String,
      confidence: Number
    }],
    // Motion detection specific
    motion: {
      detected: Boolean,
      regions: [{
        x: Number,
        y: Number,
        width: Number,
        height: Number,
        intensity: Number
      }]
    },
    // Face recognition specific
    faces: [{
      id: String,
      name: String,
      confidence: Number,
      bbox: {
        x: Number,
        y: Number,
        width: Number,
        height: Number
      },
      landmarks: [{
        x: Number,
        y: Number
      }]
    }],
    // General analysis data
    metadata: mongoose.Schema.Types.Mixed
  },
  imageData: {
    originalSize: {
      width: Number,
      height: Number
    },
    processedSize: {
      width: Number,
      height: Number
    },
    format: String,
    quality: Number
  },
  systemInfo: {
    cpu: Number,
    memory: Number,
    gpu: Number,
    temperature: Number
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed', 'partial'],
    default: 'completed'
  },
  error: {
    code: String,
    message: String,
    stack: String
  },
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
resultSchema.index({ streamId: 1 });
resultSchema.index({ modelType: 1 });
resultSchema.index({ timestamp: -1 });
resultSchema.index({ 'detections.label': 1 });
resultSchema.index({ status: 1 });

// Pre-save middleware
resultSchema.pre('save', function(next) {
  // Calculate priority based on confidence and detection count
  if (this.confidence > 0.9 && this.detections.length > 0) {
    this.priority = 'high';
  } else if (this.confidence > 0.7) {
    this.priority = 'medium';
  } else {
    this.priority = 'low';
  }
  
  next();
});

// Instance method to add detection
resultSchema.methods.addDetection = function(detection) {
  this.detections.push(detection);
  return this.save();
};

// Instance method to add defect
resultSchema.methods.addDefect = function(defect) {
  if (!this.analysis.defects) {
    this.analysis.defects = [];
  }
  this.analysis.defects.push(defect);
  return this.save();
};

// Instance method to add face
resultSchema.methods.addFace = function(face) {
  if (!this.analysis.faces) {
    this.analysis.faces = [];
  }
  this.analysis.faces.push(face);
  return this.save();
};

// Instance method to update motion data
resultSchema.methods.updateMotion = function(motionData) {
  this.analysis.motion = motionData;
  return this.save();
};

// Static method to get results by stream
resultSchema.statics.getResultsByStream = function(streamId, limit = 100) {
  return this.find({ streamId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get results by model type
resultSchema.statics.getResultsByModel = function(modelType, limit = 100) {
  return this.find({ modelType })
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get results by time range
resultSchema.statics.getResultsByTimeRange = function(startTime, endTime) {
  return this.find({
    timestamp: {
      $gte: startTime,
      $lte: endTime
    }
  }).sort({ timestamp: -1 });
};

// Static method to get detection statistics
resultSchema.statics.getDetectionStatistics = function(streamId, timeRange = 24) {
  const startTime = new Date(Date.now() - timeRange * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        streamId: mongoose.Types.ObjectId(streamId),
        timestamp: { $gte: startTime }
      }
    },
    {
      $unwind: '$detections'
    },
    {
      $group: {
        _id: '$detections.label',
        count: { $sum: 1 },
        avgConfidence: { $avg: '$detections.confidence' },
        maxConfidence: { $max: '$detections.confidence' },
        minConfidence: { $min: '$detections.confidence' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Static method to get model performance statistics
resultSchema.statics.getModelPerformance = function(timeRange = 24) {
  const startTime = new Date(Date.now() - timeRange * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startTime }
      }
    },
    {
      $group: {
        _id: '$modelType',
        totalResults: { $sum: 1 },
        avgProcessingTime: { $avg: '$processingTime' },
        avgConfidence: { $avg: '$confidence' },
        successRate: {
          $avg: {
            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
          }
        }
      }
    }
  ]);
};

// Static method to get high-confidence detections
resultSchema.statics.getHighConfidenceDetections = function(confidence = 0.8, limit = 50) {
  return this.find({
    confidence: { $gte: confidence },
    'detections.confidence': { $gte: confidence }
  })
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to clean old results
resultSchema.statics.cleanOldResults = function(daysToKeep = 30) {
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
  
  return this.deleteMany({
    timestamp: { $lt: cutoffDate },
    priority: { $ne: 'critical' }
  });
};

module.exports = mongoose.model('Result', resultSchema); 