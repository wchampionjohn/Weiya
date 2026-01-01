import React from 'react';

interface Winner {
  id: number;
  display_data: Record<string, string>;
}

interface WinnerDisplayProps {
  winner: Winner;
  index: number;
  isMe?: boolean;
}

export default function WinnerDisplay({ winner, index, isMe = false }: WinnerDisplayProps) {
  const displayData = winner.display_data || {};

  return (
    <div
      className={`bg-white border-2 border-[#2C3E50] p-3 ${
        isMe ? 'bg-yellow-100 border-yellow-500' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 bg-[#4ECDC4] text-white rounded-full flex items-center justify-center text-sm font-bold">
          {index + 1}
        </span>
        <div>
          {Object.entries(displayData).map(([field, value]) => (
            <div key={field} className="font-medium text-[#2C3E50]">
              {value}
            </div>
          ))}
          {isMe && (
            <span className="text-xs bg-yellow-500 text-white px-2 py-0.5 rounded">
              是你！
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
