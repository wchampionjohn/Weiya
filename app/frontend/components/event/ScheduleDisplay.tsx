import React from 'react';

interface ScheduleItem {
  id: number;
  name: string;
  scheduled_at: string;
  is_bonus?: boolean;
}

interface ScheduleDisplayProps {
  schedule: ScheduleItem[];
}

export default function ScheduleDisplay({ schedule }: ScheduleDisplayProps) {
  if (!schedule || schedule.length === 0) {
    return null;
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toISOString().slice(0, 10);
  };

  const now = new Date();
  const upcoming = schedule
    .filter(item => new Date(item.scheduled_at) > now)
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  if (upcoming.length === 0) {
    return null;
  }

  return (
    <section className="neo-card p-6 mb-6">
      <h3 className="text-lg font-bold text-[#2C3E50] mb-4 flex items-center gap-2">
        <span>📅</span> 預定開獎時程
      </h3>
      <div className="space-y-3">
        {upcoming.map((item, idx) => (
          <div
            key={item.id}
            className={`flex items-center justify-between p-3 border-2 border-[#2C3E50] ${
              idx === 0 ? 'bg-[#FFEAA7]' : 'bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="text-center min-w-[60px]">
                <div className="text-xs text-[#7F8C8D]">{formatDate(item.scheduled_at)}</div>
                <div className="text-lg font-bold text-[#2C3E50]">{formatTime(item.scheduled_at)}</div>
              </div>
              <div className="w-px h-8 bg-[#2C3E50]" />
              <div>
                <span className="font-bold text-[#2C3E50]">{item.name}</span>
                {item.is_bonus && (
                  <span className="ml-2 px-2 py-0.5 bg-[#F39C12] text-white text-xs font-bold rounded">
                    加碼
                  </span>
                )}
              </div>
            </div>
            {idx === 0 && (
              <span className="px-3 py-1 bg-[#E74C3C] text-white text-sm font-bold border-2 border-[#2C3E50]">
                即將開獎
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
