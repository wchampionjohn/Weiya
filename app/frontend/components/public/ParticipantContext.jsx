import React, { createContext, useContext, useState, useEffect } from 'react';
import { publicApi } from '../../lib/api';
import sessionStorage from '../../lib/sessionStorage';

const ParticipantContext = createContext(null);

export function ParticipantProvider({ children }) {
  const [participant, setParticipant] = useState(null);
  const [wins, setWins] = useState([]);

  useEffect(() => {
    const saved = sessionStorage.getParticipant();
    if (saved) {
      setParticipant(saved.participant);
      setWins(saved.wins || []);
    }
  }, []);

  const login = async (eventId, field, value) => {
    try {
      const response = await publicApi.login(eventId, field, value);
      const data = response.data;
      setParticipant(data.participant);
      setWins(data.wins || []);
      sessionStorage.setParticipant(data);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await publicApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setParticipant(null);
    setWins([]);
    sessionStorage.clearParticipant();
  };

  return (
    <ParticipantContext.Provider value={{ participant, wins, login, logout, isLoggedIn: !!participant }}>
      {children}
    </ParticipantContext.Provider>
  );
}

export function useParticipant() {
  const context = useContext(ParticipantContext);
  if (!context) {
    throw new Error('useParticipant must be used within a ParticipantProvider');
  }
  return context;
}

export default ParticipantContext;
