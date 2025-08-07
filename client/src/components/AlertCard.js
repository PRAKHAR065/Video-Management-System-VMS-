import React from 'react';
import { Card, CardContent, Typography, Chip, Box } from '@mui/material';

function AlertCard({ title, message, severity, timestamp, streamName }) {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">{title}</Typography>
          <Chip
            label={severity}
            color={
              severity === 'critical'
                ? 'error'
                : severity === 'warning'
                ? 'warning'
                : 'info'
            }
            size="small"
          />
        </Box>
        <Typography variant="body2" sx={{ mt: 1 }}>
          {message}
        </Typography>
        {streamName && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Stream: {streamName}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          {timestamp}
        </Typography>
      </CardContent>
    </Card>
  );
}

export