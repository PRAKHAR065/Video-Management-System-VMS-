import React, { useEffect, useState } from 'react';
import { Typography, Box, Card, CardContent } from '@mui/material';

function Alerts() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetch('/api/alerts')
      .then(res => res.json())
      .then(data => setAlerts(data));
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Alerts
      </Typography>
      {alerts.map((alert, idx) => (
        <Card key={idx} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6">{alert.title}</Typography>
            <Typography>{alert.message}</Typography>
            <Typography variant="caption">{alert.timestamp}</Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

export default Alerts;