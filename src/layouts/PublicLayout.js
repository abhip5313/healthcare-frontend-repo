import React from 'react';
import { Outlet, Link } from 'react-router-dom';

function PublicLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex flex-col">
      {/* Top Bar */}
      <header className="px-6 py-4">
        <Link to="/" className="flex items-center gap-2 w-fit">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">
            Health<span className="text-accent-400">Care</span>
          </span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-primary-400 text-sm">
        © {new Date().getFullYear()} HealthCare Platform. All rights reserved.
      </footer>
    </div>
  );
}

export default PublicLayout;
