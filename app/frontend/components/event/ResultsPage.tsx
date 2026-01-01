import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEvent } from './EventApp';
import { publicApi } from '../../lib/api';
import WinnerDisplay from './WinnerDisplay';

interface WinnerResult {
  id: number;
  drawn_at: string;
  prize: {
    id: number;
    name: string;
    prize_type: string;
    value: number;
  };
  display_data: Record<string, string>;
}

interface ResultsPageProps {
  showLayout?: boolean;
}

export default function ResultsPage({ showLayout = false }: ResultsPageProps) {
  const { id } = useParams();
  const { event } = useEvent();
  const [winners, setWinners] = useState<WinnerResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWinners = async () => {
      if (!event) return;

      try {
        const response = await publicApi.getEventWinners(event.id);
        setWinners(response.data);
      } catch (err) {
        console.error('Failed to load winners:', err);
      } finally {
        setLoading(false);
      }
    };

    loadWinners();
  }, [event]);

  if (loading) {
    return (
      <div className="neo-card text-center py-12">
        <p className="text-xl text-[#2C3E50]">載入中...</p>
      </div>
    );
  }

  if (winners.length === 0) {
    return (
      <div className="neo-card text-center py-12">
        <p className="text-xl text-[#2C3E50]">尚無中獎紀錄</p>
      </div>
    );
  }

  // Group winners by prize
  const groupedByPrize = winners.reduce((acc, winner) => {
    const prizeId = winner.prize.id;
    if (!acc[prizeId]) {
      acc[prizeId] = {
        prize: winner.prize,
        winners: [],
      };
    }
    acc[prizeId].winners.push(winner);
    return acc;
  }, {} as Record<number, { prize: typeof winners[0]['prize']; winners: typeof winners }>);

  const content = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#2C3E50]">中獎紀錄</h2>
        <Link
          to={`/events/${id}/overview`}
          className="neo-button bg-white text-[#2C3E50] py-1 px-3 text-sm"
        >
          ← 活動總覽
        </Link>
      </div>

      {Object.values(groupedByPrize).map(({ prize, winners: prizeWinners }) => (
        <div key={prize.id} className="neo-card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-[#2C3E50]">{prize.name}</h3>
            <div>
              <span className="neo-badge mr-2">
                {prize.prize_type === 'cash' ? '現金' : '禮品'}
              </span>
              <span className="font-bold text-[#2C3E50]">
                ${prize.value.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {prizeWinners.map((winner, index) => (
              <WinnerDisplay
                key={winner.id}
                winner={winner}
                index={index}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  if (showLayout) {
    return (
      <div className="min-h-screen bg-[#F7F7F7]">
        <header className="bg-[#FF6B6B] border-b-4 border-[#2C3E50] p-6">
          <h1 className="text-3xl font-bold text-center text-[#2C3E50]">{event?.name}</h1>
          <p className="text-center text-[#2C3E50] mt-2">
            {event?.event_date && new Date(event.event_date).toLocaleDateString('zh-TW', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </header>
        <main className="container mx-auto p-6">
          {content}
        </main>
        <footer className="border-t-4 border-[#2C3E50] p-4 text-center text-[#2C3E50] mt-8">
          <p className="font-bold">尾牙抽獎系統</p>
        </footer>
      </div>
    );
  }

  return content;
}
