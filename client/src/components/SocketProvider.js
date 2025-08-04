import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('🔌 Connected to server');
      setIsConnected(true);
      setReconnectAttempts(0);
      toast.success('Connected to server');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from server:', reason);
      setIsConnected(false);
      
      if (reason === 'io server disconnect') {
        // Server disconnected us
        toast.error('Server disconnected');
      } else if (reason === 'io client disconnect') {
        // Client disconnected
        console.log('Client disconnected');
      } else {
        // Network error
        toast.error('Connection lost. Attempting to reconnect...');
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error);
      setReconnectAttempts(prev => prev + 1);
      
      if (reconnectAttempts >= maxReconnectAttempts) {
        toast.error('Failed to connect to server after multiple attempts');
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔌 Reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      setReconnectAttempts(0);
      toast.success('Reconnected to server');
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔌 Reconnection attempt:', attemptNumber);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('🔌 Reconnection error:', error);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('🔌 Reconnection failed');
      toast.error('Failed to reconnect to server');
    });

    // Custom events
    newSocket.on('stream-status-updated', (data) => {
      console.log('📹 Stream status updated:', data);
      // You can emit a custom event or use a state management solution
      // to update the UI when stream status changes
    });

    newSocket.on('ai-result', (data) => {
      console.log('🤖 AI result received:', data);
      // Handle AI processing results
    });

    newSocket.on('ai-error', (data) => {
      console.error('🤖 AI error:', data);
      toast.error(`AI processing error: ${data.error}`);
    });

    newSocket.on('stream-error', (data) => {
      console.error('📹 Stream error:', data);
      toast.error(`Stream error: ${data.error}`);
    });

    newSocket.on('alert', (data) => {
      console.log('🚨 Alert received:', data);
      
      // Show toast notification based on alert severity
      const { alert, priority } = data;
      
      switch (priority) {
        case 'critical':
          toast.error(`🚨 ${alert.title}: ${alert.message}`, {
            duration: 10000,
            style: {
              background: '#d32f2f',
              color: '#fff',
            },
          });
          break;
        case 'high':
          toast.error(`⚠️ ${alert.title}: ${alert.message}`, {
            duration: 8000,
          });
          break;
        case 'medium':
          toast.warning(`${alert.title}: ${alert.message}`, {
            duration: 6000,
          });
          break;
        case 'low':
          toast.info(`${alert.title}: ${alert.message}`, {
            duration: 4000,
          });
          break;
        default:
          toast(`${alert.title}: ${alert.message}`);
      }
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log('🔌 Cleaning up socket connection');
      newSocket.close();
    };
  }, []);

  // Socket utility functions
  const joinStream = (streamId) => {
    if (socket && isConnected) {
      socket.emit('join-stream', streamId);
      console.log(`👥 Joined stream ${streamId}`);
    }
  };

  const leaveStream = (streamId) => {
    if (socket && isConnected) {
      socket.emit('leave-stream', streamId);
      console.log(`👋 Left stream ${streamId}`);
    }
  };

  const processAI = (streamId, modelType) => {
    if (socket && isConnected) {
      socket.emit('process-ai', { streamId, modelType });
      console.log(`🤖 Requested AI processing for stream ${streamId} with model ${modelType}`);
    }
  };

  const updateStreamStatus = (streamId, status) => {
    if (socket && isConnected) {
      socket.emit('update-stream-status', { streamId, status });
      console.log(`📹 Updated stream ${streamId} status to ${status}`);
    }
  };

  const emit = (event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  };

  const on = (event, callback) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  const off = (event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  const value = {
    socket,
    isConnected,
    reconnectAttempts,
    joinStream,
    leaveStream,
    processAI,
    updateStreamStatus,
    emit,
    on,
    off,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider; 