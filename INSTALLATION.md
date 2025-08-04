# Video Management System (VMS) - Installation Guide

This guide will help you set up the Video Management System with AI integration on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (v5 or higher) - [Download here](https://www.mongodb.com/try/download/community)
- **Git** - [Download here](https://git-scm.com/)

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd video-management-system
```

## Step 2: Install Dependencies

Install all dependencies for both backend and frontend:

```bash
npm run install-all
```

This command will install:
- Backend dependencies (Express, MongoDB, Socket.io, etc.)
- Frontend dependencies (React, Material-UI, etc.)

## Step 3: Environment Configuration

1. Copy the environment example file:
   ```bash
   cp env.example .env
   ```

2. Edit the `.env` file with your configuration:
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
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

## Step 4: Start MongoDB

Make sure MongoDB is running on your system:

### Windows:
```bash
# Start MongoDB service
net start MongoDB
```

### macOS (with Homebrew):
```bash
# Start MongoDB service
brew services start mongodb-community
```

### Linux:
```bash
# Start MongoDB service
sudo systemctl start mongod
```

## Step 5: Initialize the Database

Run the setup script to create sample data and initialize the database:

```bash
npm run setup
```

This will:
- Connect to MongoDB
- Create sample streams, alerts, and AI results
- Set up upload directories
- Initialize the system with test data

## Step 6: Start the Application

### Development Mode (Recommended)
```bash
npm run setup:dev
```

This command will:
1. Run the setup script (if not already done)
2. Start both backend and frontend servers

### Manual Start
If you prefer to start services manually:

1. Start the backend server:
   ```bash
   npm run server
   ```

2. In a new terminal, start the frontend:
   ```bash
   npm run client
   ```

## Step 7: Access the Application

Once everything is running, you can access:

- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## Step 8: Verify Installation

1. **Check Backend**: Visit http://localhost:5000/api/health
   - Should return: `{"status":"OK","timestamp":"...","uptime":...}`

2. **Check Frontend**: Visit http://localhost:3000
   - Should show the VMS dashboard with sample data

3. **Check Database**: The setup script should have created:
   - 5 sample video streams
   - 3 sample alerts
   - 2 sample AI results

## Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Ensure MongoDB is running and accessible on localhost:27017

#### 2. Port Already in Use
```
Error: listen EADDRINUSE :::5000
```
**Solution**: Change the PORT in your `.env` file or kill the process using the port

#### 3. Node Modules Not Found
```
Error: Cannot find module '...'
```
**Solution**: Run `npm run install-all` again

#### 4. React App Won't Start
```
Error: react-scripts not found
```
**Solution**: Navigate to the client directory and run `npm install`

### Port Configuration

If you need to change the default ports:

1. **Backend Port**: Edit `.env` file
   ```env
   PORT=5001
   ```

2. **Frontend Port**: Edit `client/package.json`
   ```json
   "proxy": "http://localhost:5001"
   ```

### Database Configuration

For different MongoDB setups:

#### Local MongoDB
```env
MONGODB_URI=mongodb://localhost:27017/vms
```

#### MongoDB Atlas (Cloud)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vms
```

#### MongoDB with Authentication
```env
MONGODB_URI=mongodb://username:password@localhost:27017/vms
```

## Development Workflow

### Adding New Streams

1. Use the web interface at http://localhost:3000/streams
2. Click "Add Stream" and fill in the details
3. Configure AI models for the stream
4. Start the stream to begin processing

### Testing AI Models

1. Navigate to http://localhost:3000/ai
2. Select a stream and AI model
3. Click "Process" to run AI analysis
4. View results in real-time

### Monitoring Alerts

1. Check http://localhost:3000/alerts for system alerts
2. Alerts are generated automatically based on AI detections
3. Acknowledge or resolve alerts as needed

## Production Deployment

For production deployment, consider:

1. **Environment Variables**: Set `NODE_ENV=production`
2. **Security**: Change default JWT secret and enable HTTPS
3. **Database**: Use a production MongoDB instance
4. **File Storage**: Configure cloud storage for uploads
5. **Monitoring**: Add logging and monitoring tools
6. **Scaling**: Use PM2 or similar process manager

## Support

If you encounter issues:

1. Check the console logs for error messages
2. Verify all prerequisites are installed
3. Ensure MongoDB is running
4. Check network connectivity
5. Review the troubleshooting section above

## Next Steps

After successful installation:

1. **Explore the Dashboard**: Familiarize yourself with the interface
2. **Add Real Streams**: Configure actual video sources
3. **Customize AI Models**: Modify AI model parameters
4. **Set Up Alerts**: Configure alert thresholds and notifications
5. **Monitor Performance**: Use the analytics dashboard

## System Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 10GB free space
- **Network**: Stable internet connection

### Recommended Requirements
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 50GB+ free space
- **GPU**: NVIDIA GPU (for AI processing)
- **Network**: High-speed connection

## License

This project is licensed under the MIT License. See the LICENSE file for details. 