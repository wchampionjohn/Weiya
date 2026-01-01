import React, { useState } from 'react';
import { useParticipant } from './ParticipantContext';
import '../../styles/neo-brutalism.css';

const FIELD_LABELS = {
  name: 'Name',
  employee_id: 'Employee ID',
  phone: 'Phone',
  email: 'Email',
};

export default function ParticipantLogin({ eventId, requiredFields = ['employee_id'] }) {
  const { participant, isLoggedIn, login, logout } = useParticipant();
  const [field, setField] = useState(requiredFields[0] || 'employee_id');
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(eventId, field, value);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
    } else {
      setValue('');
    }
  };

  if (isLoggedIn) {
    return (
      <div className="neo-card p-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-500">Logged in as:</span>
            <div className="font-bold">{participant.name}</div>
          </div>
          <button
            onClick={logout}
            className="neo-btn neo-btn-secondary text-sm py-1 px-3"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="neo-card p-4 mb-4">
      <h3 className="font-bold mb-3">Check Your Results</h3>

      {error && (
        <div className="bg-red-100 border-2 border-red-500 text-red-700 px-3 py-2 rounded mb-3 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {requiredFields.length > 1 && (
          <div className="mb-3">
            <select
              value={field}
              onChange={(e) => setField(e.target.value)}
              className="neo-input w-full"
            >
              {requiredFields.map(f => (
                <option key={f} value={f}>{FIELD_LABELS[f] || f}</option>
              ))}
            </select>
          </div>
        )}

        <div className="mb-3">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`Enter your ${FIELD_LABELS[field] || field}`}
            className="neo-input w-full"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="neo-btn neo-btn-secondary w-full"
        >
          {loading ? 'Checking...' : 'Check Results'}
        </button>
      </form>
    </div>
  );
}
