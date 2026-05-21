import React from 'react';

const config = {
  APPROVED: { label: 'Approved', className: 'bg-green-100 text-green-700 border border-green-200' },
  PENDING:  { label: 'Pending',  className: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
  REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-700 border border-red-200' },
};

function HospitalStatusBadge({ status }) {
  const { label, className } = config[status] || config.PENDING;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        status === 'APPROVED' ? 'bg-green-500' :
        status === 'PENDING'  ? 'bg-yellow-500' : 'bg-red-500'
      }`} />
      {label}
    </span>
  );
}

export default HospitalStatusBadge;