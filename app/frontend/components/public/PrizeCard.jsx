import React from 'react';
import WinnerDisplay from './WinnerDisplay';
import '../../styles/neo-brutalism.css';

export default function PrizeCard({ prize }) {
  const { id, name, prize_type, value, quantity, drawn, winners = [] } = prize;

  return (
    <div className={`neo-prize-card ${drawn ? 'drawn' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold">{name}</h3>
          <div className="text-sm mt-1">
            <span className="neo-badge mr-2">
              {prize_type === 'cash' ? 'Cash' : 'Gift'}
            </span>
            <span className="font-bold">${value.toLocaleString()}</span>
            <span className="text-gray-600 ml-2">x {quantity}</span>
          </div>
        </div>
        <div>
          {drawn ? (
            <span className="neo-badge neo-badge-success">Drawn</span>
          ) : (
            <span className="neo-badge neo-badge-warning">Pending</span>
          )}
        </div>
      </div>

      {drawn && winners.length > 0 && (
        <div className="mt-4 pt-4 border-t-2 border-[#2C3E50]">
          <h4 className="font-bold mb-2">Winners</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {winners.map((winner, index) => (
              <WinnerDisplay key={winner.id} winner={winner} index={index} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
