import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;
    
    if (response) {
      const { status, data } = response;
      
      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          localStorage.removeItem('authToken');
          window.location.href = '/login';
          break;
        case 403:
          toast.error('Access denied. You do not have permission to perform this action.');
          break;
        case 404:
          toast.error('Resource not found.');
          break;
        case 422:
          // Validation errors
          if (data.errors) {
            Object.values(data.errors).forEach(error => {
              toast.error(error);
            });
          } else {
            toast.error(data.message || 'Validation error occurred.');
          }
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        default:
          toast.error(data?.message || 'An error occurred.');
      }
    } else {
      // Network error
      toast.error('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

// API methods
export const apiService = {
  // Streams
  getStreams: (params = {}) => api.get('/api/streams', { params }),
  getStream: (id) => api.get(`/api/streams/${id}`),
  createStream: (data) => api.post('/api/streams', data),
  updateStream: (id, data) => api.put(`/api/streams/${id}`, data),
  deleteStream: (id) => api.delete(`/api/streams/${id}`),
  startStream: (id) => api.post(`/api/streams/${id}/start`),
  stopStream: (id) => api.post(`/api/streams/${id}/stop`),
  restartStream: (id) => api.post(`/api/streams/${id}/restart`),
  uploadVideo: (file, data = {}) => {
    const formData = new FormData();
    formData.append('video', file);
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });
    return api.post('/api/streams/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getStreamStatistics: (id) => api.get(`/api/streams/${id}/statistics`),
  resetStreamStatistics: (id) => api.post(`/api/streams/${id}/reset-statistics`),

  // AI Models
  getAIModels: () => api.get('/api/ai/models'),
  processStream: (data) => api.post('/api/ai/process', data),
  getAIResults: (params = {}) => api.get('/api/ai/results', { params }),
  getAIResult: (id) => api.get(`/api/ai/results/${id}`),
  deleteAIResult: (id) => api.delete(`/api/ai/results/${id}`),
  getAIStatistics: (params = {}) => api.get('/api/ai/statistics', { params }),
  getStreamAIStatistics: (streamId, params = {}) => 
    api.get(`/api/ai/statistics/${streamId}`, { params }),
  batchProcessStreams: (data) => api.post('/api/ai/batch-process', data),
  getHighConfidenceDetections: (params = {}) => 
    api.get('/api/ai/high-confidence', { params }),
  cleanupAIResults: (data) => api.post('/api/ai/cleanup', data),
  getStreamDetections: (streamId, params = {}) => 
    api.get(`/api/ai/stream/${streamId}/detections`, { params }),
  processStreamWithAI: (streamId, data) => 
    api.post(`/api/ai/stream/${streamId}/process`, data),

  // Alerts
  getAlerts: (params = {}) => api.get('/api/alerts', { params }),
  getActiveAlerts: () => api.get('/api/alerts/active'),
  getCriticalAlerts: () => api.get('/api/alerts/critical'),
  getAlert: (id) => api.get(`/api/alerts/${id}`),
  createAlert: (data) => api.post('/api/alerts', data),
  updateAlert: (id, data) => api.put(`/api/alerts/${id}`, data),
  deleteAlert: (id) => api.delete(`/api/alerts/${id}`),
  acknowledgeAlert: (id, data = {}) => api.post(`/api/alerts/${id}/acknowledge`, data),
  resolveAlert: (id, data = {}) => api.post(`/api/alerts/${id}/resolve`, data),
  dismissAlert: (id) => api.post(`/api/alerts/${id}/dismiss`),
  getStreamAlerts: (streamId, params = {}) => 
    api.get(`/api/alerts/stream/${streamId}`, { params }),
  getAlertStatistics: () => api.get('/api/alerts/statistics/overview'),
  cleanupAlerts: () => api.post('/api/alerts/cleanup'),
  bulkAcknowledgeAlerts: (data) => api.post('/api/alerts/bulk-acknowledge', data),
  bulkResolveAlerts: (data) => api.post('/api/alerts/bulk-resolve', data),

  // System
  getHealth: () => api.get('/api/health'),
  getStreamStatistics: () => api.get('/api/streams/statistics/overview'),
};

// Export the axios instance for direct use
export { api };

// Helper functions
export const formatDate = (date) => {
  return new Date(date).toLocaleString();
};

export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'active':
      return 'success';
    case 'inactive':
      return 'default';
    case 'error':
      return 'error';
    case 'processing':
      return 'warning';
    default:
      return 'default';
  }
};

export const getSeverityColor = (severity) => {
  switch (severity) {
    case 'critical':
      return 'error';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    case 'low':
      return 'success';
    default:
      return 'default';
  }
};

export const getConfidenceColor = (confidence) => {
  if (confidence >= 0.8) return 'success';
  if (confidence >= 0.6) return 'warning';
  return 'error';
};

// Export default for backward compatibility
export default api; 