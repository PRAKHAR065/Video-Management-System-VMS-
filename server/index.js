// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const helmet = require('helmet');
// const compression = require('compression');
// const morgan = require('morgan');
// const rateLimit = require('express-rate-limit');
// const path = require('path');
// require('dotenv').config();

// // Import routes
// const streamRoutes = require('./routes/streams');
// const aiRoutes = require('./routes/ai');
// const alertRoutes = require('./routes/alerts');

// // Import services
// const StreamService = require('./services/StreamService');
// const AIService = require('./services/AIService');
// const AlertService = require('./services/AlertService');

// const app = express();
// const PORT = process.env.PORT || 5000;

// // Security middleware
// app.use(helmet());
// app.use(compression());

// // Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100 // limit each IP to 100 requests per windowMs
// });
// app.use('/api/', limiter);

// // CORS configuration
// app.use(cors({
//   origin: process.env.NODE_ENV === 'production' 
//     ? ['https://yourdomain.com'] 
//     : ['http://localhost:3000'],
//   credentials: true
// }));

// // Body parsing middleware
// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// // Logging middleware
// app.use(morgan('combined'));

// // Static files
// app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// // Database connection
// mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vms', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
// .then(() => console.log('✅ Connected to MongoDB'))
// .catch(err => console.error('❌ MongoDB connection error:', err));

// // API Routes
// app.use('/api/streams', streamRoutes);
// app.use('/api/ai', aiRoutes);
// app.use('/api/alerts', alertRoutes);

// // Health check endpoint
// app.get('/api/health', (req, res) => {
//   res.json({ 
//     status: 'OK', 
//     timestamp: new Date().toISOString(),
//     uptime: process.uptime()
//   });
// });

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({ 
//     error: 'Something went wrong!',
//     message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
//   });
// });

// // 404 handler
// app.use('*', (req, res) => {
//   res.status(404).json({ error: 'Route not found' });
// });

// // Create HTTP server
// const server = require('http').createServer(app);

// // Socket.io setup
// const io = require('socket.io')(server, {
//   cors: {
//     origin: process.env.NODE_ENV === 'production' 
//       ? ['https://yourdomain.com'] 
//       : ['http://localhost:3000'],
//     credentials: true
//   }
// });

// // Socket.io connection handling
// io.on('connection', (socket) => {
//   console.log('🔌 Client connected:', socket.id);

//   // Join stream room
//   socket.on('join-stream', (streamId) => {
//     socket.join(`stream-${streamId}`);
//     console.log(`👥 Client ${socket.id} joined stream ${streamId}`);
//   });

//   // Leave stream room
//   socket.on('leave-stream', (streamId) => {
//     socket.leave(`stream-${streamId}`);
//     console.log(`👋 Client ${socket.id} left stream ${streamId}`);
//   });

//   // Handle AI processing requests
//   socket.on('process-ai', async (data) => {
//     try {
//       const { streamId, modelType } = data;
//       const result = await AIService.processStream(streamId, modelType);
//       socket.emit('ai-result', result);
//     } catch (error) {
//       socket.emit('ai-error', { error: error.message });
//     }
//   });

//   // Handle stream status updates
//   socket.on('update-stream-status', async (data) => {
//     try {
//       const { streamId, status } = data;
//       await StreamService.updateStreamStatus(streamId, status);
//       io.to(`stream-${streamId}`).emit('stream-status-updated', { streamId, status });
//     } catch (error) {
//       socket.emit('stream-error', { error: error.message });
//     }
//   });

//   socket.on('disconnect', () => {
//     console.log('🔌 Client disconnected:', socket.id);
//   });
// });

// // Initialize services
// const initializeServices = async () => {
//   try {
//     // Initialize AI service
//     await AIService.initialize();
//     console.log('🤖 AI Service initialized');

//     // Initialize stream service
//     await StreamService.initialize();
//     console.log('📹 Stream Service initialized');

//     // Initialize alert service
//     await AlertService.initialize();
//     console.log('🚨 Alert Service initialized');

//     // Start background tasks
//     startBackgroundTasks();
//   } catch (error) {
//     console.error('❌ Service initialization error:', error);
//   }
// };

// // Background tasks
// const startBackgroundTasks = () => {
//   // Monitor active streams
//   setInterval(async () => {
//     try {
//       await StreamService.monitorActiveStreams();
//     } catch (error) {
//       console.error('Stream monitoring error:', error);
//     }
//   }, 30000); // Every 30 seconds

//   // Process AI models
//   setInterval(async () => {
//     try {
//       await AIService.processQueuedStreams();
//     } catch (error) {
//       console.error('AI processing error:', error);
//     }
//   }, 10000); // Every 10 seconds

//   // Check for alerts
//   setInterval(async () => {
//     try {
//       await AlertService.checkForAlerts();
//     } catch (error) {
//       console.error('Alert checking error:', error);
//     }
//   }, 15000); // Every 15 seconds
// };

// // Start server
// server.listen(PORT, async () => {
//   console.log(`🚀 Server running on port ${PORT}`);
//   console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  
//   // Initialize services after server starts
//   await initializeServices();
// });

// // Graceful shutdown
// process.on('SIGTERM', () => {
//   console.log('🛑 SIGTERM received, shutting down gracefully');
//   server.close(() => {
//     console.log('✅ Server closed');
//     mongoose.connection.close(() => {
//       console.log('✅ Database connection closed');
//       process.exit(0);
//     });
//   });
// });

// process.on('SIGINT', () => {
//   console.log('🛑 SIGINT received, shutting down gracefully');
//   server.close(() => {
//     console.log('✅ Server closed');
//     mongoose.connection.close(() => {
//       console.log('✅ Database connection closed');
//       process.exit(0);
//     });
//   });
// });

// module.exports = { app, io }; 
const alertRoutes = require('./routes/alertRoutes');
// ...existing code...
app.use('/api/alerts', alertRoutes);
// ...existing code...