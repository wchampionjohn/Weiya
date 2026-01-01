import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEvent } from './EventApp';
import { useDrawChannel } from '../../lib/useDrawChannel';

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

export default function OverviewPage() {
  const { event, refresh } = useEvent();
  const { id } = useParams();

  useDrawChannel(event?.id, () => {
    refresh();
  });

  const stats = useMemo(() => {
    if (!event) return null;

    const totalPrizes = event.prizes.length;
    const drawnPrizes = event.prizes.filter((p: Prize) => p.drawn).length;
    const totalWinners = event.prizes.reduce((sum: number, p: Prize) => sum + (p.winners?.length || 0), 0);
    const totalPrizeCount = event.prizes.reduce((sum: number, p: Prize) => sum + p.quantity, 0);
    const remainingPrizes = totalPrizeCount - totalWinners;

    const currentPrize = event.prizes
      .filter((p: Prize) => !p.drawn)
      .sort((a: Prize, b: Prize) => a.position - b.position)[0];

    const nextPrize = event.prizes
      .filter((p: Prize) => !p.drawn && p.id !== currentPrize?.id)
      .sort((a: Prize, b: Prize) => a.position - b.position)[0];

    const lastDrawnPrize = event.prizes
      .filter((p: Prize) => p.drawn)
      .sort((a: Prize, b: Prize) => new Date(b.drawn_at!).getTime() - new Date(a.drawn_at!).getTime())[0];

    return {
      totalPrizes,
      drawnPrizes,
      totalWinners,
      totalPrizeCount,
      remainingPrizes,
      currentPrize,
      nextPrize,
      lastDrawnPrize,
      progress: totalPrizes > 0 ? Math.round((drawnPrizes / totalPrizes) * 100) : 0,
    };
  }, [event]);

  if (!event || !stats) return null;

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Header */}
      <header className="bg-[#FF6B6B] border-b-4 border-[#2C3E50] p-6">
        <h1 className="text-3xl font-bold text-center text-[#2C3E50]">{event.name}</h1>
        <p className="text-center text-[#2C3E50] mt-2">
          {new Date(event.event_date).toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </header>

      <main className="container mx-auto p-6">
        {/* Progress Section */}
        <section className="neo-card p-6 mb-6">
          <h2 className="text-xl font-bold text-[#2C3E50] mb-4">活動進度</h2>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm font-bold text-[#2C3E50] mb-2">
              <span>已開獎</span>
              <span>{stats.drawnPrizes} / {stats.totalPrizes} 獎項</span>
            </div>
            <div className="h-8 bg-white border-4 border-[#2C3E50] relative overflow-hidden">
              <div
                className="h-full bg-[#2ECC71] transition-all duration-500"
                style={{ width: `${stats.progress}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center font-bold text-[#2C3E50]">
                {stats.progress}%
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#3498DB] p-4 border-4 border-[#2C3E50] text-center">
              <div className="text-3xl font-bold text-white">{stats.totalPrizes}</div>
              <div className="text-sm font-bold text-white">總獎項數</div>
            </div>
            <div className="bg-[#2ECC71] p-4 border-4 border-[#2C3E50] text-center">
              <div className="text-3xl font-bold text-white">{stats.drawnPrizes}</div>
              <div className="text-sm font-bold text-white">已開獎</div>
            </div>
            <div className="bg-[#F39C12] p-4 border-4 border-[#2C3E50] text-center">
              <div className="text-3xl font-bold text-white">{stats.totalWinners}</div>
              <div className="text-sm font-bold text-white">中獎人數</div>
            </div>
            <div className="bg-[#E74C3C] p-4 border-4 border-[#2C3E50] text-center">
              <div className="text-3xl font-bold text-white">{stats.remainingPrizes}</div>
              <div className="text-sm font-bold text-white">剩餘名額</div>
            </div>
          </div>
        </section>

        {/* Current Status */}
        {stats.currentPrize && (
          <section className="neo-card p-6 mb-6 bg-[#FFEAA7]">
            <h2 className="text-xl font-bold text-[#2C3E50] mb-4">⏳ 即將抽獎</h2>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-[#2C3E50]">{stats.currentPrize.name}</div>
                <div className="text-[#2C3E50]">
                  價值 NT$ {stats.currentPrize.value.toLocaleString()} × {stats.currentPrize.quantity} 名
                </div>
              </div>
              <Link
                to={`/events/${id}/live`}
                className="neo-button bg-[#E74C3C] text-white"
              >
                前往直播
              </Link>
            </div>
          </section>
        )}

        {/* Last Draw Result */}
        {stats.lastDrawnPrize && (
          <section className="neo-card p-6 mb-6 bg-[#DFE6E9]">
            <h2 className="text-xl font-bold text-[#2C3E50] mb-4">🎉 最近中獎</h2>
            <div className="text-lg font-bold text-[#2C3E50] mb-2">
              {stats.lastDrawnPrize.name}
            </div>
            <div className="flex flex-wrap gap-2">
              {stats.lastDrawnPrize.winners.map((winner, idx) => (
                <span
                  key={winner.id}
                  className="inline-block bg-white px-3 py-1 border-2 border-[#2C3E50] font-bold"
                >
                  {Object.values(winner.display_data).join(' ')}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Navigation */}
        <section className="grid grid-cols-2 gap-4">
          <Link
            to={`/events/${id}/live`}
            className="neo-card p-6 text-center hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
          >
            <div className="text-4xl mb-2">🎯</div>
            <div className="text-xl font-bold text-[#2C3E50]">開獎直播</div>
            <div className="text-sm text-[#7F8C8D]">即時觀看抽獎過程</div>
          </Link>

          <Link
            to={`/events/${id}/results`}
            className="neo-card p-6 text-center hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
          >
            <div className="text-4xl mb-2">🏆</div>
            <div className="text-xl font-bold text-[#2C3E50]">中獎名單</div>
            <div className="text-sm text-[#7F8C8D]">查看所有得獎者</div>
          </Link>

          <Link
            to={`/events/${id}/my-results`}
            className="neo-card p-6 text-center hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
          >
            <div className="text-4xl mb-2">🔍</div>
            <div className="text-xl font-bold text-[#2C3E50]">查詢我的結果</div>
            <div className="text-sm text-[#7F8C8D]">輸入資料查詢中獎</div>
          </Link>

          <Link
            to={`/events/${id}`}
            className="neo-card p-6 text-center hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
          >
            <div className="text-4xl mb-2">🏠</div>
            <div className="text-xl font-bold text-[#2C3E50]">活動首頁</div>
            <div className="text-sm text-[#7F8C8D]">返回活動入口</div>
          </Link>
        </section>

        {/* All Prizes List */}
        <section className="neo-card p-6 mt-6">
          <h2 className="text-xl font-bold text-[#2C3E50] mb-4">全部獎項</h2>
          <div className="space-y-3">
            {event.prizes
              .sort((a: Prize, b: Prize) => a.position - b.position)
              .map((prize: Prize, idx: number) => (
                <div
                  key={prize.id}
                  className={`flex items-center justify-between p-3 border-2 border-[#2C3E50] ${
                    prize.drawn ? 'bg-[#DFE6E9]' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 flex items-center justify-center bg-[#2C3E50] text-white font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-[#2C3E50]">{prize.name}</div>
                      <div className="text-sm text-[#7F8C8D]">
                        NT$ {prize.value.toLocaleString()} × {prize.quantity} 名
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 font-bold border-2 border-[#2C3E50] ${
                      prize.drawn
                        ? 'bg-[#2ECC71] text-white'
                        : 'bg-[#F39C12] text-white'
                    }`}
                  >
                    {prize.drawn ? '已開獎' : '待抽'}
                  </span>
                </div>
              ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-[#2C3E50] p-4 text-center text-[#2C3E50] mt-8">
        <p className="font-bold">尾牙抽獎系統</p>
      </footer>
    </div>
  );
}
