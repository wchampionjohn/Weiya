import React from 'react';

export default function DistributionToggle({ distributed, distributedAt, onChange }) {
  if (distributed) {
    return (
      <div className="text-green-600">
        <span className="inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Distributed
        </span>
        {distributedAt && (
          <div className="text-xs text-gray-500">
            {new Date(distributedAt).toLocaleString('zh-TW')}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={onChange}
      className="px-3 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded text-sm"
    >
      Mark as Distributed
    </button>
  );
}
