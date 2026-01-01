import React, { createContext, useContext, useState, useCallback } from 'react';
import { useDrawChannel } from '../../lib/useDrawChannel';

const DrawContext = createContext(null);

export function DrawProvider({ eventId, children }) {
  const [latestDraw, setLatestDraw] = useState(null);
  const [drawHistory, setDrawHistory] = useState([]);

  const handleDrawResult = useCallback((data) => {
    setLatestDraw(data);
    setDrawHistory(prev => [...prev, data]);
  }, []);

  useDrawChannel(eventId, handleDrawResult);

  const clearLatestDraw = () => setLatestDraw(null);

  return (
    <DrawContext.Provider value={{ latestDraw, drawHistory, clearLatestDraw }}>
      {children}
    </DrawContext.Provider>
  );
}

export function useDraw() {
  const context = useContext(DrawContext);
  if (!context) {
    throw new Error('useDraw must be used within a DrawProvider');
  }
  return context;
}

export default DrawContext;
