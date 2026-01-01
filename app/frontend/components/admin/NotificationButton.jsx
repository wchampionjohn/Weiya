import React from 'react';

// TODO implement it - Placeholder for notification functionality
export default function NotificationButton({ winner, onNotify }) {
  return (
    <button
      onClick={() => onNotify?.(winner)}
      disabled
      className="px-2 py-1 bg-gray-100 text-gray-400 rounded text-xs cursor-not-allowed"
      title="Notification feature coming soon"
    >
      Notify
    </button>
  );
}
