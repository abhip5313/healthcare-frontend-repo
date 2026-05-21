import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const NOTIF_ICONS = {
  APPOINTMENT_CONFIRMED:   '✅',
  APPOINTMENT_CANCELLED:   '❌',
  APPOINTMENT_RESCHEDULED: '📆',
  MEETING_REMINDER:        '🎥',
  GENERAL:                 '🔔',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function NotificationBell({
  unreadCount,
  notifications,
  panelOpen,
  loading,
  onOpen,
  onClose,
  onMarkAllRead,
  onMarkOneRead,
}) {
  const navigate    = useNavigate();
  const panelRef    = useRef(null);

  // Close panel when clicking outside
  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [panelOpen, onClose]);

  const handleNotifClick = (notif) => {
    if (!notif.is_read) onMarkOneRead(notif.id);
    if (notif.appointment_id) {
      navigate(`/appointments/${notif.appointment_id}`);
      onClose();
    }
  };

  return (
    <div className="relative" ref={panelRef}>

      {/* Bell Button */}
      <button
        onClick={panelOpen ? onClose : onOpen}
        className="relative w-8 h-8 flex items-center justify-center
                   rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        {/* Bell SVG */}
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002
               6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388
               6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6
               0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white
                           text-xs rounded-full flex items-center justify-center
                           font-bold leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {panelOpen && (
        <div className="absolute right-0 top-10 w-80 bg-white rounded-xl
                        border border-gray-200 shadow-xl z-50 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3
                          border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-100
                                 text-red-600 rounded-full font-medium">
                  {unreadCount} new
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <svg className="animate-spin w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-2xl mb-2">🔔</p>
                <p className="text-xs text-gray-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map(notif => (
                <button
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50
                              hover:bg-gray-50 transition-colors
                              ${!notif.is_read ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-lg flex-shrink-0 mt-0.5">
                      {NOTIF_ICONS[notif.notif_type] || '🔔'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-relaxed
                                     ${!notif.is_read
                                       ? 'text-gray-900 font-medium'
                                       : 'text-gray-600'}`}>
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {timeAgo(notif.created_at)}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full
                                       flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

        </div>
      )}
    </div>
  );
}

export default NotificationBell;