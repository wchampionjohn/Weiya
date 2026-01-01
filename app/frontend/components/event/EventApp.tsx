import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { publicApi } from '../../lib/api';
import WelcomePage from './WelcomePage';
import OverviewPage from './OverviewPage';
import LiveDrawPage from './LiveDrawPage';
import ResultsPage from './ResultsPage';
import LoginPage from './LoginPage';
import PasswordGate from './PasswordGate';

interface Event {
  id: number;
  name: string;
  event_date: string;
  status: string;
  password_required: boolean;
  prizes: Prize[];
}

interface Prize {
  id: number;
  name: string;
  prize_type: string;
  value: number;
  quantity: number;
  drawn: boolean;
  drawn_at: string | null;
  position: number;
  winners: Winner[];
}

interface Winner {
  id: number;
  display_data: Record<string, string>;
}

interface EventContextType {
  event: Event | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  previewMode: boolean;
}

const EventContext = createContext<EventContextType | null>(null);

export function useEvent() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent must be used within EventProvider');
  }
  return context;
}

interface EventAppProps {
  eventId: string;
  previewMode?: boolean;
}

export default function EventApp({ eventId, previewMode = false }: EventAppProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const loadEvent = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await publicApi.getEvent(eventId);
      setEvent(response.data);
      setPasswordRequired(false);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('活動不存在');
      } else if (err.response?.data?.password_required) {
        setPasswordRequired(true);
      } else {
        setError('載入活動失敗');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const handlePasswordVerified = () => {
    setPasswordRequired(false);
    loadEvent();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7]">
        <div className="text-2xl font-bold text-[#2C3E50]">載入中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7]">
        <div className="neo-card p-8 text-center">
          <div className="text-2xl font-bold text-[#E74C3C] mb-4">{error}</div>
          <a href="/" className="neo-button bg-[#3498DB] text-white">
            返回首頁
          </a>
        </div>
      </div>
    );
  }

  if (passwordRequired) {
    return <PasswordGate eventId={eventId} onVerified={handlePasswordVerified} />;
  }

  if (!event) {
    return null;
  }

  return (
    <EventContext.Provider value={{ event, loading, error, refresh: loadEvent, previewMode }}>
      {previewMode && (
        <div className="bg-[#9B59B6] text-white text-center py-2 font-bold border-b-4 border-[#2C3E50]">
          🔍 預覽模式 — 此活動尚未發佈，模擬抽獎結果不會儲存
        </div>
      )}
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="overview" element={<OverviewPage />} />
        <Route path="live" element={<LiveDrawPage />} />
        <Route path="results" element={<ResultsPage showLayout />} />
        <Route path="my-results" element={<LoginPage />} />
        <Route path="login" element={<LoginPage />} />
      </Routes>
    </EventContext.Provider>
  );
}
