import React, { useEffect, useState } from 'react';

interface Winner {
  id: number;
  event_participant_id: number;
  display_data: Record<string, string>;
}

interface DrawResult {
  type?: 'draw_result' | 'simulation_result';
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

  const { type, prize_name, winners = [] } = draw;
  const isSimulation = type === 'simulation_result';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className={`border-4 border-[#F7F7F7] p-8 text-center max-w-2xl w-full max-h-[90vh] flex flex-col shadow-[8px_8px_0px_0px_#F7F7F7] ${isSimulation ? 'bg-[#8E44AD]' : 'bg-[#2C3E50]'}`}>
        {isSimulation && (
          <div className="bg-[#9B59B6] text-white px-4 py-2 mb-4 border-2 border-white font-bold flex-shrink-0">
            🔍 模擬抽獎結果
          </div>
        )}
        <h2 className={`text-4xl font-bold mb-4 animate-pulse flex-shrink-0 ${isSimulation ? 'text-[#FFEAA7]' : 'text-[#FF6B6B]'}`}>
          🎉 {prize_name} 🎉
        </h2>

        <p className="text-xl text-white mb-4 flex-shrink-0">{isSimulation ? '模擬得獎者' : '恭喜中獎者！'}</p>

        <div className="flex-1 overflow-y-auto min-h-0 mb-4">
          <div className="flex flex-wrap justify-center gap-4 p-2">
            {winners.map((winner, index) => (
              <div
                key={winner.id || winner.event_participant_id || index}
                className={`transform transition-all duration-500 ${
                  index < revealedCount
                    ? 'opacity-100 scale-100'
                    : 'opacity-0 scale-50'
                }`}
              >
                <div className={`border-4 border-[#2C3E50] p-4 min-w-[150px] shadow-[4px_4px_0px_0px_#F7F7F7] ${isSimulation ? 'bg-[#D8BFD8]' : 'bg-[#4ECDC4]'}`}>
                  <div className="text-2xl font-bold text-[#2C3E50]">
                    {Object.values(winner.display_data).map((value, i) => (
                      <div key={i}>{value}</div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onComplete}
          className="neo-button bg-[#FF6B6B] text-white flex-shrink-0"
        >
          關閉
        </button>
      </div>
    </div>
  );
}
