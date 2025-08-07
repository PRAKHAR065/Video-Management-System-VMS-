const AIModel = require('../models/AIModel');

exports.getAllModels = async (req, res) => {
  try {
    const models = await AIModel.find();
    res.json(models);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createModel = async (req, res) => {
  try {
    const model = new AIModel(req.body);
    await model.save();
    res.status(201).json(model);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getModelsByStream = async (req, res) => {
  try {
    const { streamId } = req.params;
    const models = await AIModel.find({ streamId });
    res.json(models);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};