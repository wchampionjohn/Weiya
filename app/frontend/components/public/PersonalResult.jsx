import React from 'react';
import { useParticipant } from './ParticipantContext';
import '../../styles/neo-brutalism.css';

export default function PersonalResult({ eventId }) {
  const { isLoggedIn, wins } = useParticipant();

  if (!isLoggedIn) return null;

  const eventWins = wins.filter(w => {
    // Filter wins for this event if needed
    return true;
  });

  if (eventWins.length === 0) {
    return (
      <div className="neo-card p-4">
        <h3 className="font-bold mb-2">Your Results</h3>
        <p className="text-gray-500">You haven't won any prizes yet. Good luck!</p>
      </div>
    );
  }

  return (
    <div className="neo-card p-4 bg-[#FFE66D]">
      <h3 className="font-bold mb-3">Congratulations!</h3>
      <div className="space-y-3">
        {eventWins.map(win => (
          <div key={win.id} className="bg-white border-2 border-[#2C3E50] p-3">
            <div className="font-bold text-lg">{win.prize.name}</div>
            <div className="text-sm text-gray-600">
              Value: ${win.prize.value.toLocaleString()}
            </div>
            <div className="mt-2">
              {win.distributed ? (
                <span className="inline-block bg-green-500 text-white text-xs px-2 py-1 rounded">
                  Collected
                </span>
              ) : (
                <span className="inline-block bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                  Pending Collection
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
