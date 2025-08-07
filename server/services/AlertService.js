const Alert = require('../models/Alert');

// Get all alerts
exports.getAllAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find().populate('streamId', 'name status');
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get active alerts
exports.getActiveAlerts = async (req, res) => {
  try {
    const alerts = await Alert.getActiveAlerts();
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get alerts by stream
exports.getAlertsByStream = async (req, res) => {
  try {
    const { streamId } = req.params;
    const alerts = await Alert.getAlertsByStream(streamId);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get critical alerts
exports.getCriticalAlerts = async (req, res) => {
  try {
    const alerts = await Alert.getCriticalAlerts();
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a new alert
exports.createAlert = async (req, res) => {
  try {
    const alert = new Alert(req.body);
    await alert.save();
    res.status(201).json(alert);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Acknowledge an alert
exports.acknowledgeAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const { acknowledgedBy } = req.body;
    const alert = await Alert.findById(id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    await alert.acknowledge(acknowledgedBy);
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Resolve an alert
exports.resolveAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolvedBy } = req.body;
    const alert = await Alert.findById(id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    await alert.resolve(resolvedBy);
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Dismiss an alert
exports.dismissAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await Alert.findById(id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    await alert.dismiss();
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get alert statistics
exports.getAlertStatistics = async (req, res) => {
  try {
    const stats = await Alert.getAlertStatistics();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};