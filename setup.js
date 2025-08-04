const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import models
const Stream = require('./server/models/Stream');
const Alert = require('./server/models/Alert');
const Result = require('./server/models/Result');

// Sample data
const sampleStreams = require('./sample-data/sample-streams.json');

async function setupDatabase() {
  try {
    console.log('🔄 Setting up VMS database...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vms', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Stream.deleteMany({});
    await Alert.deleteMany({});
    await Result.deleteMany({});
    
    console.log('✅ Database cleared');
    
    // Create sample streams
    console.log('📹 Creating sample streams...');
    const createdStreams = await Stream.insertMany(sampleStreams);
    console.log(`✅ Created ${createdStreams.length} sample streams`);
    
    // Create sample alerts
    console.log('🚨 Creating sample alerts...');
    const sampleAlerts = [
      {
        streamId: createdStreams[0]._id,
        type: 'detection',
        category: 'object-detection',
        title: 'Person detected at entrance',
        message: 'AI model detected a person at the main entrance',
        severity: 'medium',
        data: {
          detections: [
            {
              label: 'person',
              confidence: 0.85,
              bbox: { x: 100, y: 150, width: 80, height: 200 },
              timestamp: new Date()
            }
          ]
        }
      },
      {
        streamId: createdStreams[1]._id,
        type: 'detection',
        category: 'defect-analysis',
        title: 'Defect detected on production line',
        message: 'Quality control AI detected a defect in manufactured product',
        severity: 'high',
        data: {
          defects: [
            {
              type: 'scratch',
              severity: 'medium',
              location: { x: 200, y: 300, width: 50, height: 30 },
              description: 'Surface scratch detected',
              confidence: 0.92
            }
          ]
        }
      },
      {
        streamId: createdStreams[2]._id,
        type: 'warning',
        category: 'system',
        title: 'High CPU usage detected',
        message: 'System resources are under high load',
        severity: 'medium',
        data: {
          systemInfo: {
            cpu: 85,
            memory: 70,
            disk: 45,
            network: 30
          }
        }
      }
    ];
    
    const createdAlerts = await Alert.insertMany(sampleAlerts);
    console.log(`✅ Created ${createdAlerts.length} sample alerts`);
    
    // Create sample AI results
    console.log('🤖 Creating sample AI results...');
    const sampleResults = [
      {
        streamId: createdStreams[0]._id,
        modelType: 'object-detection',
        frameNumber: 1001,
        processingTime: 150,
        confidence: 0.85,
        detections: [
          {
            label: 'person',
            confidence: 0.85,
            bbox: { x: 100, y: 150, width: 80, height: 200 },
            classId: 1
          },
          {
            label: 'car',
            confidence: 0.72,
            bbox: { x: 300, y: 200, width: 120, height: 80 },
            classId: 3
          }
        ],
        imageData: {
          originalSize: { width: 1920, height: 1080 },
          processedSize: { width: 640, height: 480 },
          format: 'jpeg',
          quality: 0.8
        },
        systemInfo: {
          cpu: 45,
          memory: 60,
          gpu: 25,
          temperature: 45
        }
      },
      {
        streamId: createdStreams[1]._id,
        modelType: 'defect-analysis',
        frameNumber: 2501,
        processingTime: 300,
        confidence: 0.92,
        analysis: {
          defects: [
            {
              type: 'scratch',
              severity: 'medium',
              location: { x: 200, y: 300, width: 50, height: 30 },
              description: 'Surface scratch detected',
              confidence: 0.92
            }
          ]
        },
        imageData: {
          originalSize: { width: 1280, height: 720 },
          processedSize: { width: 640, height: 480 },
          format: 'jpeg',
          quality: 0.9
        },
        systemInfo: {
          cpu: 55,
          memory: 65,
          gpu: 30,
          temperature: 48
        }
      }
    ];
    
    const createdResults = await Result.insertMany(sampleResults);
    console.log(`✅ Created ${createdResults.length} sample AI results`);
    
    // Create upload directories
    console.log('📁 Creating upload directories...');
    const uploadDirs = [
      './uploads',
      './uploads/videos',
      './uploads/images',
      './uploads/recordings'
    ];
    
    uploadDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      }
    });
    
    console.log('✅ Setup completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - ${createdStreams.length} streams created`);
    console.log(`   - ${createdAlerts.length} alerts created`);
    console.log(`   - ${createdResults.length} AI results created`);
    console.log(`   - Upload directories created`);
    
    console.log('\n🚀 You can now start the VMS system:');
    console.log('   npm run dev');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase }; 