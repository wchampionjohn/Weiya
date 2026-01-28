import './application.css';
import '../styles/neo-brutalism.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../components/App';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('react-root');

  if (container) {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } else {
    console.error('Could not find #react-root element');
  }
});
