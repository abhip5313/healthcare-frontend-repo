import React from 'react';
import { StarRatingDisplay } from './StarRating';

function ReviewCard({ review, onDelete, canDelete = false }) {
  const initials = review.patient_name === 'Anonymous'
    ? '?'
    : review.patient_name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center
                          justify-center text-blue-700 font-bold text-sm flex-shrink-0">
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            {/* Name + Date */}
            <div className="flex items-center justify-between flex-wrap gap-1">
              <p className="text-sm font-semibold text-gray-900">
                {review.patient_name}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(review.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric'
                })}
              </p>
            </div>

            {/* Stars */}
            <div className="mt-1">
              <StarRatingDisplay rating={review.rating} size="sm" showNumber={false} />
            </div>

            {/* Review text */}
            {review.review && (
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                "{review.review}"
              </p>
            )}
          </div>
        </div>

        {/* Delete button */}
        {canDelete && onDelete && (
          <button
            onClick={() => onDelete(review.id)}
            className="text-gray-300 hover:text-red-500 transition-colors
                       flex-shrink-0 mt-1"
            title="Delete review"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858
                   L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default ReviewCard;