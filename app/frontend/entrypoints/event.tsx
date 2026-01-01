import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import EventApp from '../components/event/EventApp';
import './application.css';
import '../styles/neo-brutalism.css';

const container = document.getElementById('event-root');
if (container) {
  const eventId = container.dataset.eventId;
  const previewMode = container.dataset.previewMode === 'true';
  const root = createRoot(container);

  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/events/:id/*" element={<EventApp eventId={eventId} previewMode={previewMode} />} />
        </Routes>
      </BrowserRouter>
    </React.StrictMode>
  );
}
