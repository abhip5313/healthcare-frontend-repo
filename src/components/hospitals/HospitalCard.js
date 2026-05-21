import React from 'react';
import { Link } from 'react-router-dom';
import HospitalStatusBadge from './HospitalStatusBadge';

const TYPE_LABELS = {
  GENERAL:         'General',
  MULTI_SPECIALTY: 'Multi-Speciality',
  CLINIC:          'Clinic',
  DIAGNOSTIC:      'Diagnostic',
};

function HospitalCard({ hospital, showStatus = false, actions }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md
                    transition-shadow duration-200 overflow-hidden">
      {/* Header / Logo */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-5 py-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          {hospital.logo_url ? (
            <img src={hospital.logo_url} alt="logo" className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm truncate">{hospital.hospital_name}</h3>
          <p className="text-blue-200 text-xs mt-0.5">
            {TYPE_LABELS[hospital.hospital_type] || hospital.hospital_type}
          </p>
        </div>
        {showStatus && <HospitalStatusBadge status={hospital.status} />}
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-2.5">
        {/* Location */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{hospital.city}, {hospital.state}</span>
        </div>

        {/* Phone */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span>{hospital.phone_number}</span>
        </div>

        {/* Specialties */}
        {hospital.specialties?.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {hospital.specialties.slice(0, 3).map((s, i) => (
              <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                {s}
              </span>
            ))}
            {hospital.specialties.length > 3 && (
              <span className="text-xs text-gray-400">+{hospital.specialties.length - 3} more</span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
        <Link
          to={`/hospitals/${hospital.id}`}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          View Details →
        </Link>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export default HospitalCard;