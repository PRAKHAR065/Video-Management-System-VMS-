import React, { useEffect, useState } from 'react';
import { Typography, Box } from '@mui/material';
import AIResultCard from '../components/AIResultCard';

function AI() {
  const [results, setResults] = useState([]);

  useEffect(() => {
    fetch('/api/ai-results')
      .then(res => res.json())
      .then(data => setResults(data));
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        AI Model Outputs
      </Typography>
      {results.map((result, idx) => (
        <AIResultCard key={idx} {...result} />
      ))}
    </Box>
  );
}

export default AI;