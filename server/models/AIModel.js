const mongoose = require('mongoose');

const aiModelSchema = new mongoose.Schema({
  modelType: { type: String, required: true },
  parameters: mongoose.Schema.Types.Mixed,
  isActive: { type: Boolean, default: true },
  confidence: Number,
  streamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stream' }
}, { timestamps: true });

module.exports = mongoose.model('AIModel', aiModelSchema);