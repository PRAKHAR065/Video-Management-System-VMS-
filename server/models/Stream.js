const mongoose = require('mongoose');

const streamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  source: {
    type: {
      type: String,
      enum: ['rtsp', 'rtmp', 'http', 'file', 'camera'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    credentials: {
      username: String,
      password: String
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'error', 'processing'],
    default: 'inactive'
  },
  aiModels: [{
    modelType: {
      type: String,
      enum: ['object-detection', 'defect-analysis', 'face-recognition', 'motion-detection'],
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.7
    },
    parameters: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }],
  settings: {
    fps: {
      type: Number,
      default: 30,
      min: 1,
      max: 60
    },
    resolution: {
      width: {
        type: Number,
        default: 1920
      },
      height: {
        type: Number,
        default: 1080
      }
    },
    quality: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    recording: {
      enabled: {
        type: Boolean,
        default: false
      },
      duration: {
        type: Number,
        default: 3600 // 1 hour in seconds
      },
      path: String
    }
  },
  statistics: {
    totalFrames: {
      type: Number,
      default: 0
    },
    processedFrames: {
      type: Number,
      default: 0
    },
    lastProcessed: Date,
    uptime: {
      type: Number,
      default: 0
    },
    errors: {
      type: Number,
      default: 0
    }
  },
  metadata: {
    location: String,
    tags: [String],
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
streamSchema.index({ status: 1 });
streamSchema.index({ 'aiModels.modelType': 1 });
streamSchema.index({ createdAt: -1 });
streamSchema.index({ 'metadata.priority': 1 });

// Pre-save middleware to update the updatedAt field
streamSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for stream health
streamSchema.virtual('health').get(function() {
  const now = new Date();
  const lastProcessed = this.statistics.lastProcessed;
  
  if (!lastProcessed) return 'unknown';
  
  const timeDiff = now - lastProcessed;
  const fiveMinutes = 5 * 60 * 1000;
  
  if (timeDiff < fiveMinutes) return 'healthy';
  if (timeDiff < 30 * 60 * 1000) return 'warning';
  return 'error';
});

// Instance method to update statistics
streamSchema.methods.updateStatistics = function(frameCount = 1, hasError = false) {
  this.statistics.totalFrames += frameCount;
  this.statistics.processedFrames += frameCount;
  this.statistics.lastProcessed = new Date();
  
  if (hasError) {
    this.statistics.errors += 1;
  }
  
  return this.save();
};

// Instance method to reset statistics
streamSchema.methods.resetStatistics = function() {
  this.statistics = {
    totalFrames: 0,
    processedFrames: 0,
    lastProcessed: null,
    uptime: 0,
    errors: 0
  };
  
  return this.save();
};

// Static method to get active streams
streamSchema.statics.getActiveStreams = function() {
  return this.find({ status: 'active' });
};

// Static method to get streams by AI model type
streamSchema.statics.getStreamsByAIModel = function(modelType) {
  return this.find({
    'aiModels.modelType': modelType,
    'aiModels.isActive': true,
    status: 'active'
  });
};

// Static method to get stream statistics
streamSchema.statics.getStreamStatistics = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalFrames: { $sum: '$statistics.totalFrames' },
        processedFrames: { $sum: '$statistics.processedFrames' },
        errors: { $sum: '$statistics.errors' }
      }
    }
  ]);
};

module.exports = mongoose.model('Stream', streamSchema); 