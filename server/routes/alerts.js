const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');

// Get all alerts
router.get('/', alertController.getAllAlerts);

// Get active alerts
router.get('/active', alertController.getActiveAlerts);

// Get critical alerts
router.get('/critical', alertController.getCriticalAlerts);

// Get alerts by stream
router.get('/stream/:streamId', alertController.getAlertsByStream);

// Get alert statistics
router.get('/stats', alertController.getAlertStatistics);

// Create a new alert
router.post('/', alertController.createAlert);

// Acknowledge an alert
router.patch('/:id/acknowledge', alertController.acknowledgeAlert);

// Resolve an alert
router.patch('/:id/resolve', alertController.resolveAlert);

// Dismiss an alert
router.patch('/:id/dismiss', alertController.dismissAlert);

module.exports = router;