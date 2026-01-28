import React, { useState, useEffect } from 'react';
import { publicApi } from '../../lib/api';
import { DrawProvider, useDraw } from './DrawContext';
import { ParticipantProvider } from './ParticipantContext';
import PasswordGate from './PasswordGate';
import PrizeCard from './PrizeCard';
import WinnerDisplay from './WinnerDisplay';
import DrawAnimation from './DrawAnimation';
import ParticipantLogin from './ParticipantLogin';
import PersonalResult from './PersonalResult';
import '../../styles/neo-brutalism.css';

function EventContent({ event, onRefresh }) {
  const { latestDraw, clearLatestDraw } = useDraw();
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (latestDraw) {
      setShowAnimation(true);
      const timer = setTimeout(() => {
        setShowAnimation(false);
        clearLatestDraw();
        onRefresh();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [latestDraw, clearLatestDraw, onRefresh]);

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <header className="bg-[#FF6B6B] border-b-4 border-[#2C3E50] p-6">
        <h1 className="text-3xl font-bold text-center text-[#2C3E50]">{event.name}</h1>
        <p className="text-center text-[#2C3E50] mt-2">
          {new Date(event.event_date).toISOString().slice(0, 10)}
        </p>
      </header>

      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-4">Prizes</h2>
            <div className="space-y-4">
              {event.prizes?.map(prize => (
                <PrizeCard key={prize.id} prize={prize} />
              ))}
            </div>
          </div>

          <div>
            <ParticipantLogin eventId={event.id} requiredFields={event.required_fields} />
            <PersonalResult eventId={event.id} />
          </div>
        </div>
      </div>

      {showAnimation && latestDraw && (
        <DrawAnimation draw={latestDraw} />
      )}
    </div>
  );
}

export default function EventPage({ eventId }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwordRequired, setPasswordRequired] = useState(false);

  const loadEvent = async () => {
    try {
      const response = await publicApi.getEvent(eventId);
      setEvent(response.data);
      setPasswordRequired(false);
    } catch (err) {
      if (err.response?.data?.password_required) {
        setPasswordRequired(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7]">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  if (passwordRequired) {
    return <PasswordGate eventId={eventId} onVerified={loadEvent} />;
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7]">
        <div className="text-2xl text-red-500">Event not found</div>
      </div>
    );
  }

  return (
    <DrawProvider eventId={eventId}>
      <ParticipantProvider>
        <EventContent event={event} onRefresh={loadEvent} />
      </ParticipantProvider>
    </DrawProvider>
  );
}
