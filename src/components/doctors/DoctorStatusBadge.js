import React from 'react';

const config = {
  APPROVED:    { label: 'Approved',    cls: 'bg-green-100 text-green-700 border-green-200' },
  PENDING:     { label: 'Pending',     cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  REJECTED:    { label: 'Rejected',    cls: 'bg-red-100 text-red-700 border-red-200' },
  AVAILABLE:   { label: 'Available',   cls: 'bg-green-100 text-green-700 border-green-200' },
  UNAVAILABLE: { label: 'Unavailable', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  ON_LEAVE:    { label: 'On Leave',    cls: 'bg-red-100 text-red-700 border-red-200' },
};

function DoctorStatusBadge({ status }) {
  const { label, cls } = config[status] || config.PENDING;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full
                      text-xs font-semibold border ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        status === 'APPROVED' || status === 'AVAILABLE' ? 'bg-green-500' :
        status === 'PENDING'  ? 'bg-yellow-500' :
        status === 'ON_LEAVE' ? 'bg-red-500' : 'bg-red-400'
      }`} />
      {label}
    </span>
  );
}

export default DoctorStatusBadge;