import React, { useState } from 'react';
import { publicApi } from '../../lib/api';
import sessionStorage from '../../lib/sessionStorage';
import '../../styles/neo-brutalism.css';

export default function PasswordGate({ eventId, onVerified }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await publicApi.verifyEvent(eventId, password);
      if (response.data.verified) {
        sessionStorage.setEventToken(eventId, true);
        onVerified?.();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFE66D] p-4">
      <div className="neo-card p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Enter Password</h1>
        <p className="text-center text-gray-600 mb-6">
          This event requires a password to access.
        </p>

        {error && (
          <div className="bg-red-100 border-3 border-red-600 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="neo-input w-full text-lg"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="neo-btn w-full text-lg"
          >
            {loading ? 'Verifying...' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  );
}
