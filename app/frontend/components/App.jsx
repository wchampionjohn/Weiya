import React from 'react';
import EventPage from './public/EventPage';

function App() {
  // Get event ID from URL or use default
  const eventId = window.location.pathname.match(/\/events\/(\d+)/)?.[1] || '1';

  return <EventPage eventId={eventId} />;
}

export default App;
