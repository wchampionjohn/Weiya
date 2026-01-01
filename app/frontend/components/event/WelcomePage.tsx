import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEvent } from './EventApp';
import { publicApi } from '../../lib/api';

interface WelcomePageProps {
  onLogin?: () => void;
}

export default function WelcomePage({ onLogin }: WelcomePageProps) {
  const { event } = useEvent();
  const { id } = useParams();
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId.trim()) {
      setError('請輸入員工編號');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await publicApi.login(id!, { employee_id: employeeId });
      onLogin?.();
      navigate(`/events/${id}/overview`);
    } catch (err: any) {
      setError(err.response?.data?.error || '登入失敗，請確認資料是否正確');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate(`/events/${id}/overview`);
  };

  if (!event) return null;

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Event Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-[#FF6B6B] px-6 py-2 border-4 border-[#2C3E50] shadow-[4px_4px_0px_0px_#2C3E50] mb-4">
            <span className="font-bold text-[#2C3E50]">🎉 抽獎活動</span>
          </div>
          <h1 className="text-3xl font-bold text-[#2C3E50] mb-2">{event.name}</h1>
          <p className="text-[#2C3E50]">
            {new Date(event.event_date).toLocaleDateString('zh-TW', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        {/* Login Card */}
        <div className="neo-card p-6 mb-6">
          <h2 className="text-xl font-bold text-[#2C3E50] mb-4 text-center">
            輸入資料查看您的中獎結果
          </h2>

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block font-bold text-[#2C3E50] mb-2">
                員工編號
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full p-3 border-4 border-[#2C3E50] bg-white font-bold focus:outline-none focus:ring-2 focus:ring-[#3498DB]"
                placeholder="請輸入您的員工編號"
              />
            </div>

            {error && (
              <div className="bg-[#E74C3C] text-white p-3 border-4 border-[#2C3E50] mb-4 font-bold">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full neo-button bg-[#3498DB] text-white py-3 disabled:opacity-50"
            >
              {loading ? '登入中...' : '登入查詢'}
            </button>
          </form>
        </div>

        {/* Skip Button */}
        <button
          onClick={handleSkip}
          className="w-full neo-button bg-white text-[#2C3E50] py-3"
        >
          跳過登入，直接觀看抽獎
        </button>

        {/* Info */}
        <p className="text-center text-sm text-[#7F8C8D] mt-6">
          登入後可以查看您的個人中獎記錄
        </p>
      </div>
    </div>
  );
}
