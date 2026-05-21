import React from 'react';
import { Link } from 'react-router-dom';
import DoctorStatusBadge from './DoctorStatusBadge';

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`w-3 h-3 ${i <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
      <span className="text-xs text-gray-500 ml-1">
        {Number(rating).toFixed(1)} ({0} reviews)
      </span>
    </div>
  );
}

function DoctorCard({ doctor, showStatus = false, actions }) {
  const initials = doctor.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm
                    hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-800 px-5 py-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center
                        text-white font-bold text-sm flex-shrink-0 overflow-hidden">
          {doctor.profile_photo_url
            ? <img src={doctor.profile_photo_url} alt="photo"
                className="w-12 h-12 object-cover" />
            : initials
          }
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm truncate">
            Dr. {doctor.full_name}
          </h3>
          <p className="text-teal-200 text-xs mt-0.5 truncate">
            {doctor.specialization}
          </p>
        </div>
        {showStatus && <DoctorStatusBadge status={doctor.status} />}
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-2">
        {/* Hospital */}
        {doctor.hospital_name && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16"/>
            </svg>
            <span className="truncate">{doctor.hospital_name}</span>
          </div>
        )}

        {/* Experience + Fee */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">
            🩺 {doctor.experience_years} yrs exp
          </span>
          <span className="font-semibold text-teal-700">
            ₹{Number(doctor.consultation_fee).toLocaleString()}
          </span>
        </div>

        {/* Rating */}
        <StarRating rating={doctor.average_rating || 0} />

        {/* Availability */}
        <DoctorStatusBadge status={doctor.availability_status} />
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
        <Link to={`/doctors/${doctor.id}`}
          className="text-xs text-teal-600 hover:text-teal-700 font-medium">
          View Profile →
        </Link>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export default DoctorCard;