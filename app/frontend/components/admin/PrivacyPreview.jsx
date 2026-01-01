import React from 'react';

const maskValue = (value, field, masked) => {
  if (!masked || !value) return value;

  switch (field) {
    case 'name':
      if (value.length <= 1) return value;
      if (value.length === 2) return value[0] + 'X';
      return value[0] + 'X'.repeat(value.length - 2) + value[value.length - 1];
    case 'phone':
      if (value.length < 6) return value;
      return value.slice(0, 4) + '-XXX-' + value.slice(-3);
    case 'email':
      const [local, domain] = value.split('@');
      if (!domain) return value;
      const maskedLocal = local.length <= 2 ? local[0] + '***' : local.slice(0, 2) + '***';
      return maskedLocal + '@' + domain;
    case 'employee_id':
      if (value.length <= 2) return value;
      return value.slice(0, 2) + '*'.repeat(value.length - 2);
    default:
      return value;
  }
};

export default function PrivacyPreview({ displayFields, privacySettings, sampleData }) {
  const sample = sampleData || {
    name: 'John Doe',
    employee_id: 'E12345',
    phone: '0912345678',
    email: 'john@example.com',
  };

  return (
    <div className="p-4 bg-gray-50 rounded">
      <h4 className="font-medium mb-3">Privacy Preview</h4>
      <div className="space-y-2">
        {displayFields.map(field => (
          <div key={field} className="flex justify-between items-center text-sm">
            <span className="text-gray-500 capitalize">{field}:</span>
            <span className="font-mono">
              {maskValue(sample[field], field, privacySettings[field])}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
