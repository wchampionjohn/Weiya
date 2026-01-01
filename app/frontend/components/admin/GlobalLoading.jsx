import React, { useState, useEffect } from 'react';
import { Backdrop, CircularProgress, Box, Typography } from '@mui/material';
import { loadingManager } from '../../lib/api';

export default function GlobalLoading() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = loadingManager.subscribe(setLoading);
    return unsubscribe;
  }, []);

  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}
      open={loading}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <CircularProgress color="inherit" size={48} />
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          載入中...
        </Typography>
      </Box>
    </Backdrop>
  );
}
