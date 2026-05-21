import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import chatService from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now  = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60)        return 'Just now';
  if (diff < 3600)      return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)     return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function OnlineDot({ online }) {
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full border-2 border-white
      ${online ? 'bg-green-400' : 'bg-gray-300'}`} />
  );
}

function ChatListPage() {
  const { user }            = useAuth();
  const navigate            = useNavigate();
  const [rooms, setRooms]   = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await chatService.getRooms();
      setRooms(res.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const openChat = (roomId) => navigate(`/chat/${roomId}`);

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">💬 Messages</h1>
          <p className="text-xs text-gray-500 mt-0.5">Your conversations</p>
        </div>
        <span className="text-xs text-gray-400">{rooms.length} chat{rooms.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <svg className="animate-spin w-7 h-7 text-teal-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <p className="text-4xl mb-3">💬</p>
          <p className="text-sm font-medium text-gray-600">No conversations yet</p>
          <p className="text-xs text-gray-400 mt-1">
            {user?.role === 'PATIENT'
              ? 'Start a chat from Find Doctors page.'
              : 'Patients will appear here when they message you.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {rooms.map(room => (
            <button
              key={room.id}
              onClick={() => openChat(room.id)}
              className="w-full text-left bg-white rounded-xl border border-gray-100
                         shadow-sm p-4 hover:shadow-md hover:border-teal-100
                         transition-all flex items-center gap-3"
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-11 h-11 rounded-full bg-teal-100 flex items-center
                                justify-center text-teal-700 font-semibold text-sm">
                  {room.other_user_name?.charAt(0).toUpperCase()}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5">
                  <OnlineDot online={room.is_online} />
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {room.other_user_name}
                  </p>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {timeAgo(room.last_message?.created_at || room.updated_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className="text-xs text-gray-500 truncate">
                    {room.last_message
                      ? (room.last_message.msg_type !== 'TEXT'
                          ? `📎 ${room.last_message.msg_type.charAt(0) + room.last_message.msg_type.slice(1).toLowerCase()}`
                          : room.last_message.content)
                      : 'No messages yet'}
                  </p>
                  {room.unread_count > 0 && (
                    <span className="flex-shrink-0 bg-teal-500 text-white text-xs
                                     font-bold rounded-full px-1.5 py-0.5 min-w-[20px]
                                     text-center">
                      {room.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ChatListPage;