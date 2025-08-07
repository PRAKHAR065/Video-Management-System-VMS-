const Stream = require('../models/Stream');

exports.getAllStreams = async (req, res) => {
  try {
    const streams = await Stream.find();
    res.json(streams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createStream = async (req, res) => {
  try {
    const stream = new Stream(req.body);
    await stream.save();
    res.status(201).json(stream);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateStreamStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const stream = await Stream.findByIdAndUpdate(id, { status }, { new: true });
    res.json(stream);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};