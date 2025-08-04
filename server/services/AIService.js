const Stream = require('../models/Stream');
const Result = require('../models/Result');
const Alert = require('../models/Alert');
const path = require('path');
const fs = require('fs');

class AIService {
  constructor() {
    this.models = new Map();
    this.processingQueue = [];
    this.isProcessing = false;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('🔄 Initializing AI Service...');
      
      // Load available AI models
      await this.loadModels();
      
      // Start processing queue
      this.startQueueProcessing();
      
      this.isInitialized = true;
      console.log('✅ AI Service initialized successfully');
    } catch (error) {
      console.error('❌ AI Service initialization failed:', error);
      throw error;
    }
  }

  async loadModels() {
    try {
      // Define available AI models
      const modelDefinitions = [
        {
          id: 'object-detection',
          name: 'Object Detection',
          description: 'Detects objects in video frames',
          version: '1.0.0',
          supportedTypes: ['rtsp', 'rtmp', 'http', 'file', 'camera'],
          parameters: {
            confidence: { type: 'number', default: 0.7, min: 0, max: 1 },
            nmsThreshold: { type: 'number', default: 0.4, min: 0, max: 1 },
            maxDetections: { type: 'number', default: 100, min: 1, max: 1000 }
          }
        },
        {
          id: 'defect-analysis',
          name: 'Defect Analysis',
          description: 'Analyzes video for defects and anomalies',
          version: '1.0.0',
          supportedTypes: ['rtsp', 'rtmp', 'http', 'file', 'camera'],
          parameters: {
            sensitivity: { type: 'number', default: 0.8, min: 0, max: 1 },
            threshold: { type: 'number', default: 0.6, min: 0, max: 1 },
            analysisMode: { type: 'string', default: 'comprehensive', options: ['basic', 'comprehensive'] }
          }
        },
        {
          id: 'face-recognition',
          name: 'Face Recognition',
          description: 'Recognizes and identifies faces in video',
          version: '1.0.0',
          supportedTypes: ['rtsp', 'rtmp', 'http', 'file', 'camera'],
          parameters: {
            confidence: { type: 'number', default: 0.8, min: 0, max: 1 },
            faceSize: { type: 'number', default: 64, min: 32, max: 256 },
            enableTracking: { type: 'boolean', default: true }
          }
        },
        {
          id: 'motion-detection',
          name: 'Motion Detection',
          description: 'Detects motion and movement in video',
          version: '1.0.0',
          supportedTypes: ['rtsp', 'rtmp', 'http', 'file', 'camera'],
          parameters: {
            sensitivity: { type: 'number', default: 0.5, min: 0, max: 1 },
            minArea: { type: 'number', default: 100, min: 10, max: 10000 },
            history: { type: 'number', default: 50, min: 10, max: 500 }
          }
        }
      ];

      // Load each model
      for (const modelDef of modelDefinitions) {
        this.models.set(modelDef.id, {
          ...modelDef,
          isLoaded: true,
          lastUsed: null,
          processingCount: 0
        });
      }

      console.log(`📦 Loaded ${this.models.size} AI models`);
    } catch (error) {
      console.error('❌ Error loading AI models:', error);
      throw error;
    }
  }

  async getAvailableModels() {
    try {
      const models = [];
      for (const [id, model] of this.models) {
        models.push({
          id,
          name: model.name,
          description: model.description,
          version: model.version,
          supportedTypes: model.supportedTypes,
          parameters: model.parameters,
          isLoaded: model.isLoaded,
          lastUsed: model.lastUsed,
          processingCount: model.processingCount
        });
      }
      return models;
    } catch (error) {
      console.error('❌ Error getting available models:', error);
      throw error;
    }
  }

  async processStream(streamId, modelType, parameters = {}) {
    try {
      // Validate model
      if (!this.models.has(modelType)) {
        throw new Error(`AI model '${modelType}' not found`);
      }

      // Get stream
      const stream = await Stream.findById(streamId);
      if (!stream) {
        throw new Error('Stream not found');
      }

      // Check if stream supports this model
      const model = this.models.get(modelType);
      if (!model.supportedTypes.includes(stream.source.type)) {
        throw new Error(`Model '${modelType}' does not support stream type '${stream.source.type}'`);
      }

      // Add to processing queue
      const queueItem = {
        id: `${streamId}-${modelType}-${Date.now()}`,
        streamId,
        modelType,
        parameters: { ...model.parameters, ...parameters },
        timestamp: new Date(),
        priority: stream.metadata.priority || 'medium'
      };

      this.processingQueue.push(queueItem);
      
      // Update model stats
      model.lastUsed = new Date();
      model.processingCount++;

      console.log(`📋 Added stream ${stream.name} to AI processing queue with model ${modelType}`);
      
      return {
        queueId: queueItem.id,
        status: 'queued',
        estimatedTime: this.estimateProcessingTime(modelType)
      };
    } catch (error) {
      console.error(`❌ Error queuing stream for AI processing:`, error);
      throw error;
    }
  }

  async batchProcessStreams(streamIds, modelType, parameters = {}) {
    try {
      const results = [];
      
      for (const streamId of streamIds) {
        try {
          const result = await this.processStream(streamId, modelType, parameters);
          results.push({ streamId, success: true, data: result });
        } catch (error) {
          results.push({ streamId, success: false, error: error.message });
        }
      }
      
      return results;
    } catch (error) {
      console.error('❌ Error batch processing streams:', error);
      throw error;
    }
  }

  startQueueProcessing() {
    setInterval(async () => {
      if (this.isProcessing || this.processingQueue.length === 0) {
        return;
      }

      this.isProcessing = true;
      
      try {
        // Sort queue by priority and timestamp
        this.processingQueue.sort((a, b) => {
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          const aPriority = priorityOrder[a.priority] || 2;
          const bPriority = priorityOrder[b.priority] || 2;
          
          if (aPriority !== bPriority) {
            return bPriority - aPriority;
          }
          
          return a.timestamp - b.timestamp;
        });

        // Process next item
        const item = this.processingQueue.shift();
        await this.processQueueItem(item);
      } catch (error) {
        console.error('❌ Error processing queue item:', error);
      } finally {
        this.isProcessing = false;
      }
    }, 1000); // Process every second
  }

  async processQueueItem(item) {
    try {
      const { streamId, modelType, parameters } = item;
      
      console.log(`🤖 Processing stream ${streamId} with model ${modelType}`);
      
      // Simulate AI processing (replace with actual AI model calls)
      const result = await this.simulateAIProcessing(streamId, modelType, parameters);
      
      // Save result
      const aiResult = new Result({
        streamId,
        modelType,
        frameNumber: result.frameNumber,
        processingTime: result.processingTime,
        confidence: result.confidence,
        detections: result.detections,
        analysis: result.analysis,
        imageData: result.imageData,
        systemInfo: result.systemInfo
      });

      await aiResult.save();

      // Create alerts for significant detections
      if (result.detections && result.detections.length > 0) {
        const significantDetections = result.detections.filter(d => d.confidence > parameters.confidence);
        if (significantDetections.length > 0) {
          await Alert.createDetectionAlert(streamId, significantDetections, modelType);
        }
      }

      console.log(`✅ AI processing completed for stream ${streamId}`);
      
      return result;
    } catch (error) {
      console.error(`❌ Error processing queue item:`, error);
      
      // Create error alert
      await Alert.createSystemAlert(
        item.streamId,
        'error',
        'AI Processing Error',
        `AI processing failed for model ${item.modelType}: ${error.message}`,
        'high',
        { error: error.message, modelType: item.modelType }
      );
      
      throw error;
    }
  }

  async simulateAIProcessing(streamId, modelType, parameters) {
    // Simulate processing time
    const processingTime = Math.random() * 1000 + 500; // 500-1500ms
    await new Promise(resolve => setTimeout(resolve, processingTime));

    // Generate simulated results based on model type
    const results = {
      frameNumber: Math.floor(Math.random() * 1000),
      processingTime,
      confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
      detections: [],
      analysis: {},
      imageData: {
        originalSize: { width: 1920, height: 1080 },
        processedSize: { width: 640, height: 480 },
        format: 'jpeg',
        quality: 0.8
      },
      systemInfo: {
        cpu: Math.random() * 30 + 20, // 20-50%
        memory: Math.random() * 40 + 30, // 30-70%
        gpu: Math.random() * 20 + 10, // 10-30%
        temperature: Math.random() * 20 + 40 // 40-60°C
      }
    };

    // Generate model-specific detections
    switch (modelType) {
      case 'object-detection':
        results.detections = this.generateObjectDetections(parameters);
        break;
      case 'defect-analysis':
        results.analysis = this.generateDefectAnalysis(parameters);
        break;
      case 'face-recognition':
        results.analysis = this.generateFaceRecognition(parameters);
        break;
      case 'motion-detection':
        results.analysis = this.generateMotionDetection(parameters);
        break;
    }

    return results;
  }

  generateObjectDetections(parameters) {
    const objects = ['person', 'car', 'bicycle', 'dog', 'cat', 'chair', 'table'];
    const detections = [];
    const numDetections = Math.floor(Math.random() * 5) + 1;

    for (let i = 0; i < numDetections; i++) {
      detections.push({
        label: objects[Math.floor(Math.random() * objects.length)],
        confidence: Math.random() * 0.3 + 0.7,
        bbox: {
          x: Math.random() * 600,
          y: Math.random() * 400,
          width: Math.random() * 200 + 50,
          height: Math.random() * 200 + 50
        },
        classId: Math.floor(Math.random() * 100)
      });
    }

    return detections;
  }

  generateDefectAnalysis(parameters) {
    const defects = ['scratch', 'crack', 'discoloration', 'misalignment'];
    const analysis = {
      defects: []
    };

    if (Math.random() > 0.7) { // 30% chance of defect
      const numDefects = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < numDefects; i++) {
        analysis.defects.push({
          type: defects[Math.floor(Math.random() * defects.length)],
          severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          location: {
            x: Math.random() * 600,
            y: Math.random() * 400,
            width: Math.random() * 100 + 20,
            height: Math.random() * 100 + 20
          },
          description: `Detected ${defects[i]} in the image`,
          confidence: Math.random() * 0.3 + 0.7
        });
      }
    }

    return analysis;
  }

  generateFaceRecognition(parameters) {
    const faces = ['John Doe', 'Jane Smith', 'Unknown Person'];
    const analysis = {
      faces: []
    };

    const numFaces = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numFaces; i++) {
      analysis.faces.push({
        id: `face_${Date.now()}_${i}`,
        name: faces[Math.floor(Math.random() * faces.length)],
        confidence: Math.random() * 0.3 + 0.7,
        bbox: {
          x: Math.random() * 600,
          y: Math.random() * 400,
          width: Math.random() * 100 + 50,
          height: Math.random() * 100 + 50
        },
        landmarks: Array.from({ length: 5 }, () => ({
          x: Math.random() * 100,
          y: Math.random() * 100
        }))
      });
    }

    return analysis;
  }

  generateMotionDetection(parameters) {
    const analysis = {
      motion: {
        detected: Math.random() > 0.5,
        regions: []
      }
    };

    if (analysis.motion.detected) {
      const numRegions = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < numRegions; i++) {
        analysis.motion.regions.push({
          x: Math.random() * 600,
          y: Math.random() * 400,
          width: Math.random() * 200 + 50,
          height: Math.random() * 200 + 50,
          intensity: Math.random() * 0.5 + 0.5
        });
      }
    }

    return analysis;
  }

  estimateProcessingTime(modelType) {
    const baseTimes = {
      'object-detection': 1000,
      'defect-analysis': 1500,
      'face-recognition': 2000,
      'motion-detection': 800
    };

    return baseTimes[modelType] || 1000;
  }

  async processQueuedStreams() {
    // This method is called by the background task
    // The actual processing is handled by startQueueProcessing()
    return this.processingQueue.length;
  }

  async getModelPerformance(modelType, timeRange = 24) {
    try {
      const startTime = new Date(Date.now() - timeRange * 60 * 60 * 1000);
      
      const results = await Result.find({
        modelType,
        timestamp: { $gte: startTime }
      });

      if (results.length === 0) {
        return {
          modelType,
          totalResults: 0,
          avgProcessingTime: 0,
          avgConfidence: 0,
          successRate: 0
        };
      }

      const totalResults = results.length;
      const avgProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0) / totalResults;
      const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / totalResults;
      const successCount = results.filter(r => r.status === 'completed').length;
      const successRate = successCount / totalResults;

      return {
        modelType,
        totalResults,
        avgProcessingTime,
        avgConfidence,
        successRate
      };
    } catch (error) {
      console.error(`❌ Error getting model performance for ${modelType}:`, error);
      throw error;
    }
  }

  async cleanup() {
    try {
      console.log('🧹 Cleaning up AI Service...');
      
      // Clear processing queue
      this.processingQueue = [];
      
      // Clear models
      this.models.clear();
      
      console.log('✅ AI Service cleanup completed');
    } catch (error) {
      console.error('❌ AI Service cleanup failed:', error);
      throw error;
    }
  }
}

module.exports = new AIService(); 