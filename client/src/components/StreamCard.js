import React from 'react';
import { Card, CardContent, Typography, Chip, Box } from '@mui/material';

function StreamCard({ name, description, status, location, tags }) {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">{name}</Typography>
          <Chip
            label={status === 'active' ? 'Active' : status === 'inactive' ? 'Inactive' : 'Error'}
            color={status === 'active' ? 'success' : status === 'inactive' ? 'default' : 'error'}
            size="small"
          />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {description}
        </Typography>
        {location && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Location: {location}
          </Typography>
        )}
        <Box sx={{ mt: 1 }}>
          {tags && tags.map((tag, idx) => (
            <Chip key={idx} label={tag} size="small" sx={{ mr: 0.5 }} />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

export default StreamCard;