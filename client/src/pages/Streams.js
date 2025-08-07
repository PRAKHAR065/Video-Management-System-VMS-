import React, { useEffect, useState } from 'react';
import { Typography, Box, Card, CardContent } from '@mui/material';

function Streams() {
  const [streams, setStreams] = useState([]);

  useEffect(() => {
    fetch('/api/streams')
      .then(res => res.json())
      .then(data => setStreams(data));
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Active Streams
      </Typography>
      {streams.map(stream => (
        <Card key={stream.name} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6">{stream.name}</Typography>
            <Typography>{stream.description}</Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

export default Streams;