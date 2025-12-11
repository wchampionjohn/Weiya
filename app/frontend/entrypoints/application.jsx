import './application.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../components/App';

// 等待 DOM 載入完成
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('react-root');

  if (container) {
    // React 18+ 的掛載語法
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } else {
    console.error('找不到 #react-root 元素！請確認 view 中有 <div id="react-root"></div>');
  }
});
