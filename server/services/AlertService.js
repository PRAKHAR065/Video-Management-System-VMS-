const Alert = require('../models/Alert');
const Stream = require('../models/Stream');
const Result = require('../models/Result');

class AlertService {
  constructor() {
    this.isInitialized = false;
    this.alertHandlers = new Map();
    this.notificationQueue = [];
  }

  async initialize() {
    try {
      console.log('🔄 Initializing Alert Service...');
      
      // Register alert handlers
      this.registerAlertHandlers();
      
      // Start notification processing
      this.startNotificationProcessing();
      
      this.isInitialized = true;
      console.log('✅ Alert Service initialized successfully');
    } catch (error) {
      console.error('❌ Alert Service initialization failed:', error);
      throw error;
    }
  }

  registerAlertHandlers() {
    // Register handlers for different alert types
    this.alertHandlers.set('detection', this.handleDetectionAlert.bind(this));
    this.alertHandlers.set('error', this.handleErrorAlert.bind(this));
    this.alertHandlers.set('warning', this.handleWarningAlert.bind(this));
    this.alertHandlers.set('critical', this.handleCriticalAlert.bind(this));
    this.alertHandlers.set('info', this.handleInfoAlert.bind(this));
  }

  async handleDetectionAlert(alert) {
    try {
      console.log(`🚨 Detection alert: ${alert.title} for stream ${alert.streamId}`);
      
      // Add to notification queue for real-time updates
      this.notificationQueue.push({
        type: 'detection',
        alert,
        timestamp: new Date(),
        priority: 'high'
      });
      
      // Additional processing for detection alerts
      if (alert.data.detections && alert.data.detections.length > 0) {
        await this.processDetections(alert);
      }
    } catch (error) {
      console.error('❌ Error handling detection alert:', error);
    }
  }

  async handleErrorAlert(alert) {
    try {
      console.log(`❌ Error alert: ${alert.title} for stream ${alert.streamId}`);
      
      // Add to notification queue
      this.notificationQueue.push({
        type: 'error',
        alert,
        timestamp: new Date(),
        priority: 'critical'
      });
      
      // Log error details
      if (alert.data.error) {
        console.error('Error details:', alert.data.error);
      }
    } catch (error) {
      console.error('❌ Error handling error alert:', error);
    }
  }

  async handleWarningAlert(alert) {
    try {
      console.log(`⚠️ Warning alert: ${alert.title} for stream ${alert.streamId}`);
      
      // Add to notification queue
      this.notificationQueue.push({
        type: 'warning',
        alert,
        timestamp: new Date(),
        priority: 'medium'
      });
    } catch (error) {
      console.error('❌ Error handling warning alert:', error);
    }
  }

  async handleCriticalAlert(alert) {
    try {
      console.log(`🚨 CRITICAL alert: ${alert.title} for stream ${alert.streamId}`);
      
      // Add to notification queue with highest priority
      this.notificationQueue.push({
        type: 'critical',
        alert,
        timestamp: new Date(),
        priority: 'critical'
      });
      
      // Immediate action for critical alerts
      await this.takeImmediateAction(alert);
    } catch (error) {
      console.error('❌ Error handling critical alert:', error);
    }
  }

  async handleInfoAlert(alert) {
    try {
      console.log(`ℹ️ Info alert: ${alert.title} for stream ${alert.streamId}`);
      
      // Add to notification queue
      this.notificationQueue.push({
        type: 'info',
        alert,
        timestamp: new Date(),
        priority: 'low'
      });
    } catch (error) {
      console.error('❌ Error handling info alert:', error);
    }
  }

  async processDetections(alert) {
    try {
      const { detections } = alert.data;
      
      // Group detections by type
      const detectionGroups = {};
      detections.forEach(detection => {
        const label = detection.label;
        if (!detectionGroups[label]) {
          detectionGroups[label] = [];
        }
        detectionGroups[label].push(detection);
      });
      
      // Log detection summary
      console.log('Detection summary:');
      Object.entries(detectionGroups).forEach(([label, items]) => {
        console.log(`  - ${label}: ${items.length} detected`);
      });
      
      // Check for unusual patterns
      await this.checkForUnusualPatterns(alert.streamId, detections);
      
    } catch (error) {
      console.error('❌ Error processing detections:', error);
    }
  }

  async checkForUnusualPatterns(streamId, detections) {
    try {
      // Get recent detections for this stream
      const recentResults = await Result.find({ streamId })
        .sort({ timestamp: -1 })
        .limit(10);
      
      if (recentResults.length < 5) {
        return; // Not enough data for pattern analysis
      }
      
      // Analyze detection patterns
      const detectionCounts = {};
      recentResults.forEach(result => {
        if (result.detections) {
          result.detections.forEach(detection => {
            const label = detection.label;
            detectionCounts[label] = (detectionCounts[label] || 0) + 1;
          });
        }
      });
      
      // Check for unusual increases
      const currentDetections = {};
      detections.forEach(detection => {
        const label = detection.label;
        currentDetections[label] = (currentDetections[label] || 0) + 1;
      });
      
      // Flag unusual patterns
      Object.entries(currentDetections).forEach(([label, count]) => {
        const avgCount = detectionCounts[label] / recentResults.length;
        if (count > avgCount * 3) { // 3x more than average
          console.warn(`⚠️ Unusual detection pattern: ${count} ${label} detected (avg: ${avgCount.toFixed(1)})`);
        }
      });
      
    } catch (error) {
      console.error('❌ Error checking for unusual patterns:', error);
    }
  }

  async takeImmediateAction(alert) {
    try {
      console.log(`🚨 Taking immediate action for critical alert: ${alert.title}`);
      
      // Get stream information
      const stream = await Stream.findById(alert.streamId);
      if (!stream) {
        console.error('Stream not found for critical alert');
        return;
      }
      
      // Example immediate actions:
      // 1. Stop stream if it's causing issues
      if (alert.category === 'system' && alert.data.error) {
        console.log(`🛑 Stopping stream ${stream.name} due to critical error`);
        // await StreamService.stopStream(alert.streamId);
      }
      
      // 2. Send emergency notifications
      await this.sendEmergencyNotification(alert);
      
      // 3. Log critical event
      console.error(`🚨 CRITICAL EVENT: ${alert.title} - ${alert.message}`);
      
    } catch (error) {
      console.error('❌ Error taking immediate action:', error);
    }
  }

  async sendEmergencyNotification(alert) {
    try {
      // This would integrate with external notification services
      // For now, just log the emergency notification
      console.log(`🚨 EMERGENCY NOTIFICATION: ${alert.title}`);
      console.log(`   Stream: ${alert.streamId}`);
      console.log(`   Severity: ${alert.severity}`);
      console.log(`   Message: ${alert.message}`);
      console.log(`   Timestamp: ${alert.timestamp}`);
      
      // In a real implementation, this would send:
      // - Email notifications
      // - SMS alerts
      // - Slack/Discord messages
      // - Phone calls
      // - etc.
      
    } catch (error) {
      console.error('❌ Error sending emergency notification:', error);
    }
  }

  startNotificationProcessing() {
    setInterval(async () => {
      if (this.notificationQueue.length === 0) {
        return;
      }
      
      // Sort by priority and timestamp
      this.notificationQueue.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority] || 1;
        const bPriority = priorityOrder[b.priority] || 1;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        return a.timestamp - b.timestamp;
      });
      
      // Process notifications
      const notification = this.notificationQueue.shift();
      await this.processNotification(notification);
      
    }, 1000); // Process every second
  }

  async processNotification(notification) {
    try {
      const { type, alert, priority } = notification;
      
      // Get the appropriate handler
      const handler = this.alertHandlers.get(type);
      if (handler) {
        await handler(alert);
      }
      
      // Additional notification processing
      await this.broadcastNotification(notification);
      
    } catch (error) {
      console.error('❌ Error processing notification:', error);
    }
  }

  async broadcastNotification(notification) {
    try {
      // This would broadcast to connected clients via Socket.io
      // For now, just log the broadcast
      console.log(`📡 Broadcasting notification: ${notification.type} - ${notification.alert.title}`);
      
      // In a real implementation:
      // io.emit('alert', {
      //   type: notification.type,
      //   alert: notification.alert,
      //   priority: notification.priority,
      //   timestamp: notification.timestamp
      // });
      
    } catch (error) {
      console.error('❌ Error broadcasting notification:', error);
    }
  }

  async checkForAlerts() {
    try {
      // Check for streams that haven't been processed recently
      const streams = await Stream.find({ status: 'active' });
      const now = new Date();
      
      for (const stream of streams) {
        const lastProcessed = stream.statistics.lastProcessed;
        
        if (lastProcessed) {
          const timeSinceLastProcessed = now - lastProcessed;
          
          // Alert if stream hasn't been processed for more than 5 minutes
          if (timeSinceLastProcessed > 5 * 60 * 1000) {
            const existingAlert = await Alert.findOne({
              streamId: stream._id,
              type: 'warning',
              title: 'Stream Unresponsive',
              status: 'active'
            });
            
            if (!existingAlert) {
              await Alert.createSystemAlert(
                stream._id,
                'warning',
                'Stream Unresponsive',
                `Stream ${stream.name} has not processed frames for ${Math.floor(timeSinceLastProcessed / 1000)} seconds`,
                'medium'
              );
            }
          }
        }
      }
      
      // Check for high error rates
      for (const stream of streams) {
        const { errors, totalFrames } = stream.statistics;
        
        if (totalFrames > 0) {
          const errorRate = errors / totalFrames;
          
          if (errorRate > 0.1) { // More than 10% error rate
            const existingAlert = await Alert.findOne({
              streamId: stream._id,
              type: 'error',
              title: 'High Error Rate',
              status: 'active'
            });
            
            if (!existingAlert) {
              await Alert.createSystemAlert(
                stream._id,
                'error',
                'High Error Rate',
                `Stream ${stream.name} has a high error rate: ${(errorRate * 100).toFixed(1)}%`,
                'high',
                { errorRate, errors, totalFrames }
              );
            }
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Error checking for alerts:', error);
    }
  }

  async getAlertStatistics(timeRange = 24) {
    try {
      const startTime = new Date(Date.now() - timeRange * 60 * 60 * 1000);
      
      const statistics = await Alert.aggregate([
        {
          $match: {
            timestamp: { $gte: startTime }
          }
        },
        {
          $group: {
            _id: {
              type: '$type',
              severity: '$severity',
              status: '$status'
            },
            count: { $sum: 1 }
          }
        }
      ]);
      
      return statistics;
    } catch (error) {
      console.error('❌ Error getting alert statistics:', error);
      throw error;
    }
  }

  async getActiveAlertsCount() {
    try {
      const count = await Alert.countDocuments({
        status: 'active',
        $or: [
          { expiresAt: { $gt: new Date() } },
          { expiresAt: null }
        ]
      });
      
      return count;
    } catch (error) {
      console.error('❌ Error getting active alerts count:', error);
      throw error;
    }
  }

  async getCriticalAlertsCount() {
    try {
      const count = await Alert.countDocuments({
        severity: 'critical',
        status: 'active'
      });
      
      return count;
    } catch (error) {
      console.error('❌ Error getting critical alerts count:', error);
      throw error;
    }
  }

  async cleanup() {
    try {
      console.log('🧹 Cleaning up Alert Service...');
      
      // Clear notification queue
      this.notificationQueue = [];
      
      // Clear alert handlers
      this.alertHandlers.clear();
      
      console.log('✅ Alert Service cleanup completed');
    } catch (error) {
      console.error('❌ Alert Service cleanup failed:', error);
      throw error;
    }
  }
}

module.exports = new AlertService(); 