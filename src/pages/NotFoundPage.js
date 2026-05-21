import React from 'react';
import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* 404 Illustration */}
        <div className="w-32 h-32 mx-auto mb-8 bg-primary-50 rounded-full flex items-center justify-center">
          <svg className="w-16 h-16 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-6xl font-extrabold text-primary-600 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Page Not Found</h2>
        <p className="text-gray-500 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="btn-primary"
          >
            Back to Dashboard
          </Link>
          <Link
            to="/login"
            className="btn-secondary"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
