import React, { useState } from 'react';
import { publicApi } from '../../lib/api';
import sessionStorage from '../../lib/sessionStorage';

interface PasswordGateProps {
  eventId: string;
  onVerified: () => void;
}

export default function PasswordGate({ eventId, onVerified }: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await publicApi.verifyEvent(eventId, password);
      if (response.data.verified) {
        sessionStorage.setEventToken(eventId, true);
        onVerified();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '密碼驗證失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFE66D] p-4">
      <div className="neo-card p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center text-[#2C3E50] mb-6">
          請輸入活動密碼
        </h1>
        <p className="text-center text-gray-600 mb-6">
          此活動需要密碼才能進入
        </p>

        {error && (
          <div className="bg-red-100 border-3 border-red-600 text-red-700 px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="輸入密碼"
              className="neo-input w-full text-lg"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="neo-button w-full text-lg bg-[#3498DB] text-white"
          >
            {loading ? '驗證中...' : '進入活動'}
          </button>
        </form>
      </div>
    </div>
  );
}
