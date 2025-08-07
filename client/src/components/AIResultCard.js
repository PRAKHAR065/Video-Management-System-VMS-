import React from 'react';
import { Card, CardContent, Typography, Chip } from '@mui/material';

function AIResultCard({ streamName, modelType, result, timestamp }) {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6">{streamName}</Typography>
        <Chip label={modelType} sx={{ mr: 1 }} />
        <Typography variant="body2" sx={{ mt: 1 }}>
          Result: {result}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {timestamp}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default AIResultCard;