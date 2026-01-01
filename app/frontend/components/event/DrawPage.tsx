import React, { useState, useEffect } from 'react';
import { useEvent } from './EventApp';
import { useDrawChannel } from '../../lib/useDrawChannel';
import PrizeCard from './PrizeCard';
import DrawAnimation from './DrawAnimation';

interface DrawResult {
  type: string;
  prize_id: number;
  prize_name: string;
  winners: Array<{
    id: number;
    event_participant_id: number;
    display_data: Record<string, string>;
  }>;
}

export default function DrawPage() {
  const { event, refresh } = useEvent();
  const [latestDraw, setLatestDraw] = useState<DrawResult | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);

  const handleDrawResult = (data: DrawResult) => {
    setLatestDraw(data);
    setShowAnimation(true);
  };

  useDrawChannel(event?.id, handleDrawResult);

  useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => {
        setShowAnimation(false);
        setLatestDraw(null);
        refresh();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showAnimation, refresh]);

  if (!event) return null;

  const undrawnPrizes = event.prizes.filter(p => !p.drawn);
  const drawnPrizes = event.prizes.filter(p => p.drawn);

  return (
    <div>
      {undrawnPrizes.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-[#2C3E50]">待抽獎項</h2>
          <div className="space-y-4">
            {undrawnPrizes.map(prize => (
              <PrizeCard key={prize.id} prize={prize} />
            ))}
          </div>
        </section>
      )}

      {drawnPrizes.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-4 text-[#2C3E50]">已開獎項</h2>
          <div className="space-y-4">
            {drawnPrizes.map(prize => (
              <PrizeCard key={prize.id} prize={prize} />
            ))}
          </div>
        </section>
      )}

      {event.prizes.length === 0 && (
        <div className="neo-card text-center py-12">
          <p className="text-xl text-[#2C3E50]">尚無獎項</p>
        </div>
      )}

      {showAnimation && latestDraw && (
        <DrawAnimation draw={latestDraw} onComplete={() => setShowAnimation(false)} />
      )}
    </div>
  );
}
