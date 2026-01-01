import React from 'react';
import WinnerReveal from './WinnerReveal';
import '../../styles/neo-brutalism.css';

export default function DrawAnimation({ draw }) {
  if (!draw) return null;

  const { prize_name, winners = [] } = draw;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="neo-draw-animation p-8 text-center">
        <h2 className="text-4xl font-bold text-white mb-8 animate-pulse">
          {prize_name}
        </h2>

        <div className="flex flex-wrap justify-center gap-4">
          {winners.map((winner, index) => (
            <WinnerReveal
              key={winner.id}
              winner={winner}
              index={index}
              delay={index * 500}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
