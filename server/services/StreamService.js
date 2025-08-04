const Stream = require('../models/Stream');
const Result = require('../models/Result');
const Alert = require('../models/Alert');
const { Worker } = require('worker_threads');
const path = require('path');
const fs = require('fs');

class StreamService {
  constructor() {
    this.activeStreams = new Map();
    this.workers = new Map();
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('🔄 Initializing Stream Service...');
      
      // Create upload directories if they don't exist
      const uploadDirs = [
        path.join(__dirname, '../../uploads'),
        path.join(__dirname, '../../uploads/videos'),
        path.join(__dirname, '../../uploads/images'),
        path.join(__dirname, '../../uploads/recordings')
      ];
      
      uploadDirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      });
      
      // Load existing active streams
      const activeStreams = await Stream.find({ status: 'active' });
      for (const stream of activeStreams) {
        await this.startStream(stream._id);
      }
      
      this.isInitialized = true;
      console.log('✅ Stream Service initialized successfully');
    } catch (error) {
      console.error('❌ Stream Service initialization failed:', error);
      throw error;
    }
  }

  async initializeStream(streamId) {
    try {
      const stream = await Stream.findById(streamId);
      if (!stream) {
        throw new Error('Stream not found');
      }

      // Set initial status
      stream.status = 'inactive';
      await stream.save();

      console.log(`📹 Stream ${stream.name} initialized`);
      return stream;
    } catch (error) {
      console.error(`❌ Failed to initialize stream ${streamId}:`, error);
      throw error;
    }
  }

  async startStream(streamId) {
    try {
      const stream = await Stream.findById(streamId);
      if (!stream) {
        throw new Error('Stream not found');
      }

      // Check if stream is already active
      if (this.activeStreams.has(streamId.toString())) {
        console.log(`⚠️ Stream ${stream.name} is already active`);
        return stream;
      }

      // Create worker thread for stream processing
      const worker = new Worker(path.join(__dirname, '../workers/streamWorker.js'), {
        workerData: {
          streamId: streamId.toString(),
          streamData: stream.toObject()
        }
      });

      // Handle worker messages
      worker.on('message', async (message) => {
        await this.handleWorkerMessage(streamId, message);
      });

      worker.on('error', async (error) => {
        console.error(`❌ Worker error for stream ${streamId}:`, error);
        await this.handleStreamError(streamId, error);
      });

      worker.on('exit', async (code) => {
        if (code !== 0) {
          console.error(`❌ Worker stopped with exit code ${code} for stream ${streamId}`);
          await this.handleStreamError(streamId, new Error(`Worker exited with code ${code}`));
        }
      });

      // Store worker and stream info
      this.workers.set(streamId.toString(), worker);
      this.activeStreams.set(streamId.toString(), {
        stream,
        startTime: new Date(),
        frameCount: 0,
        lastFrame: null
      });

      // Update stream status
      stream.status = 'active';
      await stream.save();

      console.log(`▶️ Stream ${stream.name} started successfully`);
      return stream;
    } catch (error) {
      console.error(`❌ Failed to start stream ${streamId}:`, error);
      throw error;
    }
  }

  async stopStream(streamId) {
    try {
      const streamIdStr = streamId.toString();
      
      // Stop worker if exists
      const worker = this.workers.get(streamIdStr);
      if (worker) {
        worker.terminate();
        this.workers.delete(streamIdStr);
      }

      // Remove from active streams
      this.activeStreams.delete(streamIdStr);

      // Update stream status
      const stream = await Stream.findById(streamId);
      if (stream) {
        stream.status = 'inactive';
        await stream.save();
        console.log(`⏹️ Stream ${stream.name} stopped successfully`);
      }

      return true;
    } catch (error) {
      console.error(`❌ Failed to stop stream ${streamId}:`, error);
      throw error;
    }
  }

  async restartStream(streamId) {
    try {
      await this.stopStream(streamId);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      return await this.startStream(streamId);
    } catch (error) {
      console.error(`❌ Failed to restart stream ${streamId}:`, error);
      throw error;
    }
  }

  async updateStream(streamId) {
    try {
      const stream = await Stream.findById(streamId);
      if (!stream) {
        throw new Error('Stream not found');
      }

      // If stream is active, restart it to apply changes
      if (stream.status === 'active') {
        await this.restartStream(streamId);
      }

      return stream;
    } catch (error) {
      console.error(`❌ Failed to update stream ${streamId}:`, error);
      throw error;
    }
  }

  async updateStreamStatus(streamId, status) {
    try {
      const stream = await Stream.findById(streamId);
      if (!stream) {
        throw new Error('Stream not found');
      }

      stream.status = status;
      await stream.save();

      return stream;
    } catch (error) {
      console.error(`❌ Failed to update stream status ${streamId}:`, error);
      throw error;
    }
  }

  async handleWorkerMessage(streamId, message) {
    try {
      const { type, data } = message;
      
      switch (type) {
        case 'frame_processed':
          await this.handleFrameProcessed(streamId, data);
          break;
        case 'ai_result':
          await this.handleAIResult(streamId, data);
          break;
        case 'error':
          await this.handleStreamError(streamId, new Error(data.message));
          break;
        case 'status_update':
          await this.updateStreamStatus(streamId, data.status);
          break;
        default:
          console.log(`📨 Unknown message type from stream ${streamId}:`, type);
      }
    } catch (error) {
      console.error(`❌ Error handling worker message for stream ${streamId}:`, error);
    }
  }

  async handleFrameProcessed(streamId, data) {
    try {
      const streamInfo = this.activeStreams.get(streamId.toString());
      if (streamInfo) {
        streamInfo.frameCount++;
        streamInfo.lastFrame = new Date();
      }

      // Update stream statistics
      const stream = await Stream.findById(streamId);
      if (stream) {
        await stream.updateStatistics(1, false);
      }
    } catch (error) {
      console.error(`❌ Error handling frame processed for stream ${streamId}:`, error);
    }
  }

  async handleAIResult(streamId, data) {
    try {
      // Save AI result
      const result = new Result({
        streamId,
        modelType: data.modelType,
        frameNumber: data.frameNumber,
        processingTime: data.processingTime,
        confidence: data.confidence,
        detections: data.detections || [],
        analysis: data.analysis || {},
        imageData: data.imageData || {},
        systemInfo: data.systemInfo || {}
      });

      await result.save();

      // Create alert if high confidence detections found
      if (data.detections && data.detections.length > 0) {
        const highConfidenceDetections = data.detections.filter(d => d.confidence > 0.8);
        if (highConfidenceDetections.length > 0) {
          await Alert.createDetectionAlert(streamId, highConfidenceDetections, data.modelType);
        }
      }

      console.log(`🤖 AI result saved for stream ${streamId}, model: ${data.modelType}`);
    } catch (error) {
      console.error(`❌ Error handling AI result for stream ${streamId}:`, error);
    }
  }

  async handleStreamError(streamId, error) {
    try {
      // Update stream status to error
      await this.updateStreamStatus(streamId, 'error');

      // Create error alert
      const stream = await Stream.findById(streamId);
      if (stream) {
        await Alert.createSystemAlert(
          streamId,
          'error',
          'Stream Processing Error',
          `Stream ${stream.name} encountered an error: ${error.message}`,
          'high',
          { error: error.message }
        );
      }

      console.error(`❌ Stream error handled for ${streamId}:`, error.message);
    } catch (err) {
      console.error(`❌ Error handling stream error for ${streamId}:`, err);
    }
  }

  async monitorActiveStreams() {
    try {
      const now = new Date();
      
      for (const [streamId, streamInfo] of this.activeStreams) {
        const { stream, startTime, lastFrame } = streamInfo;
        
        // Check if stream is still responsive
        if (lastFrame && (now - lastFrame) > 30000) { // 30 seconds
          console.warn(`⚠️ Stream ${stream.name} appears unresponsive`);
          
          // Create warning alert
          await Alert.createSystemAlert(
            streamId,
            'warning',
            'Stream Unresponsive',
            `Stream ${stream.name} has not processed frames in 30 seconds`,
            'medium'
          );
        }
        
        // Update uptime
        const uptime = Math.floor((now - startTime) / 1000);
        stream.statistics.uptime = uptime;
        await stream.save();
      }
    } catch (error) {
      console.error('❌ Error monitoring active streams:', error);
    }
  }

  async getStreamStatistics(streamId) {
    try {
      const stream = await Stream.findById(streamId);
      if (!stream) {
        throw new Error('Stream not found');
      }

      // Get recent AI results
      const recentResults = await Result.find({ streamId })
        .sort({ timestamp: -1 })
        .limit(10);

      // Get recent alerts
      const recentAlerts = await Alert.find({ streamId })
        .sort({ timestamp: -1 })
        .limit(5);

      return {
        stream: {
          id: stream._id,
          name: stream.name,
          status: stream.status,
          statistics: stream.statistics,
          health: stream.health
        },
        recentResults,
        recentAlerts,
        activeInfo: this.activeStreams.get(streamId.toString()) || null
      };
    } catch (error) {
      console.error(`❌ Error getting stream statistics for ${streamId}:`, error);
      throw error;
    }
  }

  async getActiveStreamsInfo() {
    try {
      const activeStreams = [];
      
      for (const [streamId, streamInfo] of this.activeStreams) {
        const { stream, startTime, frameCount, lastFrame } = streamInfo;
        
        activeStreams.push({
          id: stream._id,
          name: stream.name,
          status: stream.status,
          startTime,
          frameCount,
          lastFrame,
          uptime: Math.floor((new Date() - startTime) / 1000)
        });
      }
      
      return activeStreams;
    } catch (error) {
      console.error('❌ Error getting active streams info:', error);
      throw error;
    }
  }

  async cleanup() {
    try {
      console.log('🧹 Cleaning up Stream Service...');
      
      // Stop all active streams
      for (const [streamId] of this.activeStreams) {
        await this.stopStream(streamId);
      }
      
      // Terminate all workers
      for (const [streamId, worker] of this.workers) {
        worker.terminate();
      }
      
      this.activeStreams.clear();
      this.workers.clear();
      
      console.log('✅ Stream Service cleanup completed');
    } catch (error) {
      console.error('❌ Stream Service cleanup failed:', error);
      throw error;
    }
  }
}

module.exports = new StreamService(); 