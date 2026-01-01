import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEvent } from './EventApp';
import { useDrawChannel } from '../../lib/useDrawChannel';
import DrawAnimation from './DrawAnimation';

interface Prize {
  id: number;
  name: string;
  prize_type: string;
  value: number;
  quantity: number;
  drawn: boolean;
  drawn_at: string | null;
  position: number;
  winners: Array<{
    id: number;
    display_data: Record<string, string>;
  }>;
}

interface DrawResult {
  type: 'draw_result' | 'simulation_result';
  prize_id: number;
  prize_name: string;
  winners: Array<{
    id: number;
    event_participant_id: number;
    display_data: Record<string, string>;
    simulated?: boolean;
  }>;
}

export default function LiveDrawPage() {
  const { event, refresh, previewMode } = useEvent();
  const { id } = useParams();
  const [latestDraw, setLatestDraw] = useState<DrawResult | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);

  const handleDrawResult = (data: DrawResult) => {
    setLatestDraw(data);
    setShowAnimation(true);
  };

  useDrawChannel(event?.id, handleDrawResult);

  const handleAnimationClose = () => {
    setShowAnimation(false);
    // Only refresh data for real draws, not simulations
    if (latestDraw?.type === 'draw_result') {
      refresh();
    }
    setLatestDraw(null);
  };

  const stats = useMemo(() => {
    if (!event) return null;

    const sortedPrizes = [...event.prizes].sort((a: Prize, b: Prize) => a.position - b.position);
    const totalPrizes = event.prizes.length;
    const drawnPrizes = event.prizes.filter((p: Prize) => p.drawn).length;

    const currentPrize = sortedPrizes.find((p: Prize) => !p.drawn);
    const currentIndex = currentPrize ? sortedPrizes.indexOf(currentPrize) + 1 : totalPrizes;

    const undrawnPrizes = sortedPrizes.filter((p: Prize) => !p.drawn);
    const lastDrawnPrizes = sortedPrizes
      .filter((p: Prize) => p.drawn)
      .sort((a: Prize, b: Prize) => new Date(b.drawn_at!).getTime() - new Date(a.drawn_at!).getTime())
      .slice(0, 3);

    return {
      totalPrizes,
      drawnPrizes,
      currentPrize,
      currentIndex,
      undrawnPrizes,
      lastDrawnPrizes,
      progress: totalPrizes > 0 ? Math.round((drawnPrizes / totalPrizes) * 100) : 0,
      isComplete: drawnPrizes === totalPrizes,
    };
  }, [event]);

  if (!event || !stats) return null;

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Header with Progress */}
      <header className="bg-[#FF6B6B] border-b-4 border-[#2C3E50] p-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-2">
            <Link
              to={`/events/${id}/overview`}
              className="neo-button bg-white text-[#2C3E50] py-1 px-3 text-sm"
            >
              ← 活動總覽
            </Link>
            <h1 className="text-xl font-bold text-[#2C3E50]">{event.name}</h1>
            <div className="text-sm font-bold text-[#2C3E50]">
              {new Date(event.event_date).toLocaleDateString('zh-TW')}
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="bg-white border-4 border-[#2C3E50] p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-[#2C3E50]">
                🎯 開獎進度
              </span>
              <span className="text-2xl font-bold text-[#2C3E50]">
                {stats.drawnPrizes} / {stats.totalPrizes}
              </span>
            </div>
            <div className="h-4 bg-[#DFE6E9] border-2 border-[#2C3E50] relative overflow-hidden">
              <div
                className="h-full bg-[#2ECC71] transition-all duration-500"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        {/* Current Prize Section */}
        {!stats.isComplete && stats.currentPrize && (
          <section className="neo-card p-8 mb-6 bg-[#FFEAA7] text-center">
            <div className="text-sm font-bold text-[#2C3E50] mb-2">
              目前抽獎：第 {stats.currentIndex} / {stats.totalPrizes} 個獎項
            </div>
            <h2 className="text-3xl font-bold text-[#2C3E50] mb-4">
              {stats.currentPrize.name}
            </h2>
            <div className="text-xl text-[#2C3E50] mb-4">
              價值 NT$ {stats.currentPrize.value.toLocaleString()} × {stats.currentPrize.quantity} 名
            </div>
            <div className="inline-block bg-[#E74C3C] text-white px-6 py-3 border-4 border-[#2C3E50] font-bold animate-pulse">
              ⏳ 等待後台開獎...
            </div>
          </section>
        )}

        {/* Complete Message */}
        {stats.isComplete && (
          <section className="neo-card p-8 mb-6 bg-[#2ECC71] text-center">
            <div className="text-4xl mb-4">🎊</div>
            <h2 className="text-3xl font-bold text-white mb-2">
              活動已完成！
            </h2>
            <p className="text-white text-lg mb-4">
              所有獎項已抽完
            </p>
            <Link
              to={`/events/${id}/results`}
              className="neo-button bg-white text-[#2C3E50]"
            >
              查看完整中獎名單
            </Link>
          </section>
        )}

        {/* Waiting for Next Draw */}
        {!stats.isComplete && (
          <section className="neo-card p-6 mb-6">
            <h3 className="text-lg font-bold text-[#2C3E50] mb-4">📋 待抽獎項</h3>
            <div className="space-y-2">
              {stats.undrawnPrizes.map((prize: Prize, idx: number) => (
                <div
                  key={prize.id}
                  className={`flex items-center justify-between p-3 border-2 border-[#2C3E50] ${
                    idx === 0 ? 'bg-[#FFEAA7]' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center bg-[#2C3E50] text-white text-sm font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-[#2C3E50]">{prize.name}</span>
                  </div>
                  <span className="text-sm text-[#7F8C8D]">
                    NT$ {prize.value.toLocaleString()} × {prize.quantity}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent Winners */}
        {stats.lastDrawnPrizes.length > 0 && (
          <section className="neo-card p-6">
            <h3 className="text-lg font-bold text-[#2C3E50] mb-4">🎉 最近得獎</h3>
            <div className="space-y-4">
              {stats.lastDrawnPrizes.map((prize: Prize) => (
                <div key={prize.id} className="bg-[#DFE6E9] p-4 border-2 border-[#2C3E50]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[#2C3E50]">{prize.name}</span>
                    <span className="text-sm text-[#7F8C8D]">
                      {prize.drawn_at && new Date(prize.drawn_at).toLocaleTimeString('zh-TW')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {prize.winners.map((winner) => (
                      <span
                        key={winner.id}
                        className="inline-block bg-white px-3 py-1 border-2 border-[#2C3E50] font-bold text-sm"
                      >
                        {Object.values(winner.display_data).join(' ')}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <Link
              to={`/events/${id}/results`}
              className="block mt-4 text-center neo-button bg-[#3498DB] text-white"
            >
              查看完整中獎名單
            </Link>
          </section>
        )}
      </main>

      {/* Draw Animation */}
      {showAnimation && latestDraw && (
        <DrawAnimation draw={latestDraw} onComplete={handleAnimationClose} />
      )}

      {/* Footer */}
      <footer className="border-t-4 border-[#2C3E50] p-4 text-center text-[#2C3E50] mt-8">
        <p className="font-bold">尾牙抽獎系統</p>
      </footer>
    </div>
  );
}
