import React, { useState } from 'react';

const LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

// ── Interactive Star Rating (for input) ──────────────────────────────────
export function StarRatingInput({ value, onChange, size = 'md' }) {
  const [hovered, setHovered] = useState(0);
  const starSize = size === 'lg' ? 'w-8 h-8' : size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110 focus:outline-none"
        >
          <svg
            className={`${starSize} transition-colors ${
              star <= (hovered || value)
                ? 'text-yellow-400'
                : 'text-gray-200'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07
              3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588
              1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921
              -.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175
              0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1
              1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1
              1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        </button>
      ))}
      {(hovered || value) > 0 && (
        <span className="text-xs text-gray-500 ml-1 font-medium">
          {LABELS[hovered || value]}
        </span>
      )}
    </div>
  );
}

// ── Display Star Rating (read-only) ──────────────────────────────────────
export function StarRatingDisplay({ rating, size = 'sm', showNumber = true }) {
  const starSize = size === 'lg' ? 'w-5 h-5' : size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const filled   = Math.round(rating);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <svg
          key={star}
          className={`${starSize} ${
            star <= filled ? 'text-yellow-400' : 'text-gray-200'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07
            3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588
            1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921
            -.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175
            0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1
            1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1
            1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
      {showNumber && (
        <span className="text-xs text-gray-500 ml-1">
          {Number(rating).toFixed(1)}
        </span>
      )}
    </div>
  );
}

export default StarRatingDisplay;