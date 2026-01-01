import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '../lib/theme';
import AdminApp from '../components/admin/AdminApp';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('admin-root');

  if (container) {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AdminApp />
        </ThemeProvider>
      </React.StrictMode>
    );
  } else {
    console.error('Could not find #admin-root element');
  }
});
