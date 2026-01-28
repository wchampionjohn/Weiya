import React, { useState, useEffect } from 'react';
import '../../styles/neo-brutalism.css';

export default function WinnerReveal({ winner, index, delay = 0 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!visible) {
    return (
      <div className="w-48 h-32 bg-gray-700 rounded-lg flex items-center justify-center">
        <div className="text-4xl animate-spin">?</div>
      </div>
    );
  }

  const displayData = winner.display_data || {};

  return (
    <div className="neo-winner-reveal neo-card p-6 min-w-48">
      <div className="text-center">
        <div className="w-12 h-12 bg-[#FFE66D] rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-[#2C3E50]">
          <span className="text-xl font-bold">{index + 1}</span>
        </div>
        {Object.entries(displayData).map(([field, value]) => (
          <div key={field} className="text-xl font-bold text-[#2C3E50]">
            {value}
          </div>
        ))}
      </div>
    </div>
  );
}
