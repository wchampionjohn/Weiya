import React from 'react';
import WinnerDisplay from './WinnerDisplay';

interface Winner {
  id: number;
  display_data: Record<string, string>;
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

interface PrizeCardProps {
  prize: Prize;
}

export default function PrizeCard({ prize }: PrizeCardProps) {
  const { name, prize_type, value, quantity, drawn, winners = [] } = prize;

  return (
    <div
      className={`neo-card ${
        drawn ? 'bg-[#E8E8E8]' : 'bg-white'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-[#2C3E50]">{name}</h3>
          <div className="text-sm mt-1">
            <span className="neo-badge mr-2">
              {prize_type === 'cash' ? '現金' : '禮品'}
            </span>
            <span className="font-bold text-[#2C3E50]">
              ${value.toLocaleString()}
            </span>
            <span className="text-gray-600 ml-2">x {quantity}</span>
          </div>
        </div>
        <div>
          {drawn ? (
            <span className="neo-badge bg-[#27AE60] text-white">已開獎</span>
          ) : (
            <span className="neo-badge bg-[#F39C12] text-white">待開獎</span>
          )}
        </div>
      </div>

      {drawn && winners.length > 0 && (
        <div className="mt-4 pt-4 border-t-2 border-[#2C3E50]">
          <h4 className="font-bold mb-2 text-[#2C3E50]">中獎者</h4>
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
