import React, { useEffect, useState } from 'react';

interface Winner {
  id: number;
  event_participant_id: number;
  display_data: Record<string, string>;
}

interface DrawResult {
  prize_name: string;
  winners: Winner[];
}

interface DrawAnimationProps {
  draw: DrawResult;
  onComplete?: () => void;
}

export default function DrawAnimation({ draw, onComplete }: DrawAnimationProps) {
  const [revealedCount, setRevealedCount] = useState(0);

  useEffect(() => {
    if (!draw) return;

    const interval = setInterval(() => {
      setRevealedCount(prev => {
        if (prev >= draw.winners.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [draw]);

  if (!draw) return null;

  const { prize_name, winners = [] } = draw;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-[#2C3E50] border-4 border-[#F7F7F7] p-8 text-center max-w-2xl mx-4 shadow-[8px_8px_0px_0px_#F7F7F7]">
        <h2 className="text-4xl font-bold text-[#FF6B6B] mb-8 animate-pulse">
          🎉 {prize_name} 🎉
        </h2>

        <p className="text-xl text-white mb-6">恭喜中獎者！</p>

        <div className="flex flex-wrap justify-center gap-4">
          {winners.map((winner, index) => (
            <div
              key={winner.id}
              className={`transform transition-all duration-500 ${
                index < revealedCount
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-50'
              }`}
            >
              <div className="bg-[#4ECDC4] border-4 border-[#2C3E50] p-4 min-w-[150px] shadow-[4px_4px_0px_0px_#F7F7F7]">
                <div className="text-2xl font-bold text-[#2C3E50]">
                  {Object.values(winner.display_data).map((value, i) => (
                    <div key={i}>{value}</div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onComplete}
          className="mt-8 neo-button bg-[#FF6B6B] text-white"
        >
          關閉
        </button>
      </div>
    </div>
  );
}
