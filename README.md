# Video Management System (VMS) with AI Integration

A comprehensive Video Management System built with the MERN stack that can handle multiple video streams, camera feeds, and image inputs with real-time AI model integration.

## 🚀 Features

- **Multi-Input Handling**: Support for 10+ video streams, camera feeds, and image folders
- **AI Model Integration**: Real-time and batch inference with multiple AI models
- **Real-time Dashboard**: Live monitoring of streams and AI outputs
- **Scalable Architecture**: Async processing with thread management
- **Alert System**: Real-time notifications for detected events
- **RESTful API**: Complete backend API for stream management

## 🏗️ Architecture

```
VMS/
├── server/                 # Backend (Node.js + Express)
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── ai/               # AI model integrations
│   └── utils/            # Helper functions
├── client/                # Frontend (React)
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── utils/        # Helper functions
└── sample-data/          # Sample videos and images
```

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express.js** - Server framework
- **MongoDB** + **Mongoose** - Database
- **Socket.io** - Real-time communication
- **OpenCV** - Video processing
- **Multer** - File upload handling

### Frontend
- **React.js** - UI framework
- **Socket.io-client** - Real-time updates
- **Chart.js** - Data visualization
- **Material-UI** - UI components

### AI Integration
- **TensorFlow.js** - Client-side AI
- **OpenCV.js** - Image processing
- **Custom AI Models** - Object detection, defect analysis

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn
- Git

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd video-management-system
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

## ⚙️ Configuration

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/vms

# AI Model Configuration
AI_MODEL_PATH=./models/
AI_CONFIDENCE_THRESHOLD=0.7

# File Storage
UPLOAD_PATH=./uploads/
MAX_FILE_SIZE=100MB

# Security
JWT_SECRET=your-secret-key
```

## 📁 Project Structure

### Backend Structure
```
server/
├── index.js              # Main server file
├── config/
│   ├── database.js       # MongoDB configuration
│   └── socket.js         # Socket.io configuration
├── models/
│   ├── Stream.js         # Video stream model
│   ├── Alert.js          # Alert model
│   └── Result.js         # AI result model
├── routes/
│   ├── streams.js        # Stream management routes
│   ├── ai.js            # AI model routes
│   └── alerts.js        # Alert routes
├── services/
│   ├── StreamService.js  # Stream management logic
│   ├── AIService.js      # AI model integration
│   └── AlertService.js   # Alert management
└── ai/
    ├── models/           # AI model files
    ├── detectors.js      # Object detection
    └── analyzers.js      # Defect analysis
```

### Frontend Structure
```
client/
├── public/
├── src/
│   ├── components/
│   │   ├── Dashboard/    # Dashboard components
│   │   ├── StreamView/   # Stream viewing components
│   │   └── Alerts/       # Alert components
│   ├── pages/
│   │   ├── Home.js       # Main dashboard
│   │   ├── Streams.js    # Stream management
│   │   └── Analytics.js  # Analytics page
│   ├── services/
│   │   ├── api.js        # API service
│   │   └── socket.js     # Socket service
│   └── utils/
│       ├── constants.js  # App constants
│       └── helpers.js    # Helper functions
```

## 🎯 Usage

### Adding Video Streams

1. **Via Dashboard**: Use the web interface to add streams
2. **Via API**: POST to `/api/streams` with stream configuration
3. **Via File Upload**: Upload video files to `/api/streams/upload`

### AI Model Integration

1. **Configure Models**: Add AI models to `server/ai/models/`
2. **Set Parameters**: Configure detection thresholds and parameters
3. **Start Processing**: Models will automatically process streams

### Monitoring

1. **Dashboard**: View all active streams and results
2. **Alerts**: Receive real-time notifications for events
3. **Analytics**: View historical data and trends

## 🔧 API Endpoints

### Streams
- `GET /api/streams` - Get all streams
- `POST /api/streams` - Create new stream
- `PUT /api/streams/:id` - Update stream
- `DELETE /api/streams/:id` - Delete stream

### AI Models
- `GET /api/ai/models` - Get available models
- `POST /api/ai/process` - Process stream with AI
- `GET /api/ai/results` - Get AI results

### Alerts
- `GET /api/alerts` - Get all alerts
- `POST /api/alerts` - Create alert
- `PUT /api/alerts/:id` - Update alert

## 📊 Sample Data

The project includes sample videos and images in the `sample-data/` directory for testing:

- Sample video files
- Test images
- AI model configurations

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`

2. **OpenCV Installation Issues**
   - Install system dependencies
   - Use pre-built binaries if available

3. **Port Conflicts**
   - Change port in `.env`
   - Check if ports are already in use

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions, please open an issue in the repository. 