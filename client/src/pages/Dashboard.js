import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  IconButton,
  Button,
  Alert,
  Paper,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Psychology as AIIcon,
  Notifications as AlertIcon,
  VideoLibrary as StreamIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

import { api } from '../services/api';
import StreamCard from '../components/StreamCard';
import AlertCard from '../components/AlertCard';
import AIResultCard from '../components/AIResultCard';

const Dashboard = () => {
  const [systemStats, setSystemStats] = useState({
    totalStreams: 0,
    activeStreams: 0,
    totalAlerts: 0,
    activeAlerts: 0,
    aiProcessing: 0,
    systemHealth: 'good',
  });

  // Fetch dashboard data
  const { data: streams, isLoading: streamsLoading } = useQuery(
    'streams',
    () => api.get('/api/streams?limit=5'),
    { refetchInterval: 5000 }
  );

  const { data: alerts, isLoading: alertsLoading } = useQuery(
    'alerts',
    () => api.get('/api/alerts/active'),
    { refetchInterval: 10000 }
  );

  const { data: aiResults, isLoading: aiLoading } = useQuery(
    'ai-results',
    () => api.get('/api/ai/results?limit=5'),
    { refetchInterval: 15000 }
  );

  const { data: statistics, isLoading: statsLoading } = useQuery(
    'statistics',
    () => api.get('/api/streams/statistics/overview'),
    { refetchInterval: 30000 }
  );

  // Performance data for charts
  const [performanceData, setPerformanceData] = useState([]);

  useEffect(() => {
    // Generate sample performance data
    const generatePerformanceData = () => {
      const data = [];
      const now = new Date();
      
      for (let i = 11; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 5 * 60 * 1000); // 5-minute intervals
        data.push({
          time: time.toLocaleTimeString(),
          fps: Math.random() * 30 + 15,
          cpu: Math.random() * 40 + 20,
          memory: Math.random() * 30 + 40,
        });
      }
      
      setPerformanceData(data);
    };

    generatePerformanceData();
    const interval = setInterval(generatePerformanceData, 300000); // Update every 5 minutes

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (streams?.data && alerts?.data && statistics?.data) {
      setSystemStats({
        totalStreams: streams.data.length,
        activeStreams: streams.data.filter(s => s.status === 'active').length,
        totalAlerts: alerts.data.length,
        activeAlerts: alerts.data.filter(a => a.status === 'active').length,
        aiProcessing: aiResults?.data?.length || 0,
        systemHealth: 'good',
      });
    }
  }, [streams, alerts, aiResults, statistics]);

  const handleStreamAction = async (streamId, action) => {
    try {
      await api.post(`/api/streams/${streamId}/${action}`);
      toast.success(`Stream ${action}ed successfully`);
    } catch (error) {
      toast.error(`Failed to ${action} stream`);
    }
  };

  const getHealthColor = (health) => {
    switch (health) {
      case 'good': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const StatCard = ({ title, value, icon, color, subtitle, progress }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              backgroundColor: `${color}.main`,
              borderRadius: '50%',
              p: 1,
              mr: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
        {progress !== undefined && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );

  if (streamsLoading || alertsLoading || aiLoading || statsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 1, fontWeight: 'bold' }}>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Real-time monitoring of your video management system
        </Typography>
      </Box>

      {/* System Status Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        System is running normally. All services are operational.
      </Alert>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Streams"
            value={systemStats.totalStreams}
            icon={<StreamIcon sx={{ color: 'white' }} />}
            color="primary"
            subtitle={`${systemStats.activeStreams} active`}
            progress={(systemStats.activeStreams / systemStats.totalStreams) * 100}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Alerts"
            value={systemStats.activeAlerts}
            icon={<AlertIcon sx={{ color: 'white' }} />}
            color="warning"
            subtitle={`${systemStats.totalAlerts} total alerts`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="AI Processing"
            value={systemStats.aiProcessing}
            icon={<AIIcon sx={{ color: 'white' }} />}
            color="secondary"
            subtitle="Models running"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="System Health"
            value={systemStats.systemHealth.toUpperCase()}
            icon={<TrendingUpIcon sx={{ color: 'white' }} />}
            color={getHealthColor(systemStats.systemHealth)}
            subtitle="All systems operational"
          />
        </Grid>
      </Grid>

      {/* Performance Chart */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                System Performance
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="time" stroke="#fff" />
                  <YAxis stroke="#fff" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #333',
                      color: '#fff',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="fps"
                    stroke="#2196f3"
                    strokeWidth={2}
                    name="FPS"
                  />
                  <Line
                    type="monotone"
                    dataKey="cpu"
                    stroke="#f50057"
                    strokeWidth={2}
                    name="CPU %"
                  />
                  <Line
                    type="monotone"
                    dataKey="memory"
                    stroke="#4caf50"
                    strokeWidth={2}
                    name="Memory %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={() => window.location.reload()}
                  fullWidth
                >
                  Refresh Dashboard
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<SpeedIcon />}
                  onClick={() => window.open('/api/health', '_blank')}
                  fullWidth
                >
                  System Status
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AIIcon />}
                  onClick={() => window.location.href = '/ai'}
                  fullWidth
                >
                  AI Models
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Active Streams */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Active Streams
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => window.location.href = '/streams'}
            >
              View All
            </Button>
          </Box>
        </Grid>
        {streams?.data?.slice(0, 4).map((stream) => (
          <Grid item xs={12} sm={6} md={3} key={stream._id}>
            <StreamCard
              stream={stream}
              onAction={handleStreamAction}
            />
          </Grid>
        ))}
      </Grid>

      {/* Recent Alerts and AI Results */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Recent Alerts
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => window.location.href = '/alerts'}
            >
              View All
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {alerts?.data?.slice(0, 3).map((alert) => (
              <AlertCard key={alert._id} alert={alert} />
            ))}
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Recent AI Results
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => window.location.href = '/ai'}
            >
              View All
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {aiResults?.data?.slice(0, 3).map((result) => (
              <AIResultCard key={result._id} result={result} />
            ))}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 