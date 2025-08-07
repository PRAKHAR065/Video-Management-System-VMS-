const mongoose = require('mongoose');

const streamSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: String,
  source: {
    type: { type: String, required: true },
    url: { type: String, required: true },
    credentials: {
      username: String,
      password: String
    }
  },
  aiModels: [{
    modelType: String,
    isActive: Boolean,
    confidence: Number,
    parameters: mongoose.Schema.Types.Mixed
  }],
  settings: mongoose.Schema.Types.Mixed,
  metadata: mongoose.Schema.Types.Mixed,
  status: { type: String, enum: ['active', 'inactive', 'error'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Stream', streamSchema);