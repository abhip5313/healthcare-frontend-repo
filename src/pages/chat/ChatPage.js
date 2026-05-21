import React, {
  useEffect, useState, useRef, useCallback, useMemo
} from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import chatService from '../../services/chatService';
import { useChatWebSocket } from '../../hooks/useChatWebSocket';
import { useAuth } from '../../context/AuthContext';

// ── Helpers ───────────────────────────────────────────────────────────────

function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d   = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === now.toDateString())       return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function sameDay(a, b) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Tick component (✓ / ✓✓) ──────────────────────────────────────────────
function Ticks({ isRead, isMine }) {
  if (!isMine) return null;
  return (
    <span className={`text-xs ml-1 ${isRead ? 'text-teal-400' : 'text-gray-400'}`}>
      {isRead ? '✓✓' : '✓'}
    </span>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────
function MessageBubble({ msg, isMine }) {
  const isText         = msg.msg_type === 'TEXT';
  const isImage        = msg.msg_type === 'IMAGE';
  const isVoice        = msg.msg_type === 'VOICE';
  const isFile         = msg.msg_type === 'FILE';
  const isPrescription = msg.msg_type === 'PRESCRIPTION';

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1`}>
      <div className={`max-w-[75%] ${isMine
        ? 'bg-teal-500 text-white rounded-2xl rounded-tr-sm'
        : 'bg-white text-gray-900 rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm'}
        px-3 py-2`}>

        {/* Text */}
        {isText && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {msg.content}
          </p>
        )}

        {/* Image */}
        {isImage && msg.file_url && (
          <div>
            <img
              src={msg.file_url}
              alt="Shared image"
              className="rounded-lg max-w-full max-h-64 object-cover cursor-pointer"
              onClick={() => window.open(msg.file_url, '_blank')}
            />
            {msg.content && (
              <p className="text-xs mt-1 opacity-80">{msg.content}</p>
            )}
          </div>
        )}

        {/* Voice */}
        {isVoice && msg.file_url && (
          <div className="flex items-center gap-2 min-w-[180px]">
            <span className="text-lg">🎤</span>
            <audio controls className="h-8 flex-1" style={{ minWidth: 140 }}>
              <source src={msg.file_url} />
            </audio>
          </div>
        )}

        {/* File */}
        {isFile && (
          <a
            href={msg.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 text-sm hover:underline
              ${isMine ? 'text-white' : 'text-teal-600'}`}
          >
            <span className="text-xl">📎</span>
            <div>
              <p className="font-medium truncate max-w-[180px]">
                {msg.file_name || 'File'}
              </p>
              {msg.file_size && (
                <p className="text-xs opacity-70">{formatFileSize(msg.file_size)}</p>
              )}
            </div>
          </a>
        )}

        {/* Prescription */}
        {isPrescription && (
          <div className={`flex items-start gap-2 ${isMine ? 'text-white' : 'text-gray-800'}`}>
            <span className="text-xl flex-shrink-0">💊</span>
            <div>
              <p className="text-xs font-semibold opacity-70 uppercase tracking-wide mb-0.5">
                Prescription
              </p>
              <p className="text-sm">{msg.content}</p>
            </div>
          </div>
        )}

        {/* Time + ticks */}
        <div className={`flex items-center justify-end gap-1 mt-1
          ${isMine ? 'text-teal-100' : 'text-gray-400'}`}>
          <span className="text-[10px]">{formatTime(msg.created_at)}</span>
          <Ticks isRead={msg.is_read} isMine={isMine} />
        </div>
      </div>
    </div>
  );
}

// ── Typing Indicator ──────────────────────────────────────────────────────
function TypingIndicator({ name }) {
  return (
    <div className="flex justify-start mb-1">
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl
                      rounded-tl-sm px-4 py-2 flex items-center gap-1.5">
        <span className="text-xs text-gray-500">{name} is typing</span>
        <span className="flex gap-0.5">
          {[0,1,2].map(i => (
            <span key={i}
              className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}

// ── Main ChatPage ─────────────────────────────────────────────────────────
function ChatPage() {
  const { roomId }     = useParams();
  const { user }       = useAuth();
  const navigate       = useNavigate();
  const location       = useLocation();

  // Pre-filled prescription data from PrescriptionListPage
  const prescriptionData = location.state?.prescription || null;

  const [messages, setMessages]           = useState([]);
  const [otherUser, setOtherUser]         = useState(
    location.state?.otherUser || null
  );
  const [otherOnline, setOtherOnline]     = useState(false);
  const [otherLastSeen, setOtherLastSeen] = useState(null);
  const [loading, setLoading]             = useState(true);
  const [text, setText]                   = useState('');
  const [otherTyping, setOtherTyping]     = useState(false);
  const [recording, setRecording]         = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  const bottomRef    = useRef(null);
  const fileInputRef = useRef(null);
  const imgInputRef  = useRef(null);
  const camInputRef  = useRef(null);
  const typingTimer  = useRef(null);
  const chunksRef    = useRef([]);

  // ── Load messages + room info ─────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        // Load messages
        const res = await chatService.getMessages(roomId);
        const msgs = res.data || [];
        setMessages(msgs);

        // Get other user from messages
        if (msgs.length > 0) {
          const other = msgs.find(m => m.sender_id !== user?.id);
          if (other) {
            setOtherUser({ id: other.sender_id, name: other.sender_name, role: other.sender_role });
          }
        }

        // If still no otherUser — get from rooms list
        if (!otherUser) {
          const roomsRes = await chatService.getRooms();
          const rooms = roomsRes.data || [];
          const room = rooms.find(r => r.id === parseInt(roomId));
          if (room) {
            setOtherUser({ id: room.other_user_id, name: room.other_user_name, role: room.other_user_role });
            setOtherOnline(room.is_online || false);
          }
        }
      } catch (e) {
        console.error('Load error:', e);
        toast.error('Could not load messages.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [roomId]); // eslint-disable-line

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherTyping]);

  // ── WebSocket handler ─────────────────────────────────────────────
  const handleWsMessage = useCallback((data) => {
    if (data.event === 'message') {
      setMessages(prev => {
        // Replace temp message if exists, otherwise add
        const hasDuplicate = prev.some(m => m.id === data.id);
        if (hasDuplicate) return prev;
        // Remove temp messages (text or file) from same sender
        const filtered = prev.filter(m => {
          if (typeof m.id !== 'string') return true;
          if (!m.id.startsWith('temp-')) return true;
          // Match temp-text by content
          if (m.id.startsWith('temp-file-') && m.sender_id === data.sender_id &&
              m.msg_type === data.msg_type && m.file_name === data.file_name) return false;
          if (!m.id.startsWith('temp-file-') && m.content === data.content &&
              m.sender_id === data.sender_id) return false;
          return true;
        });
        return [...filtered, data];
      });
      // Set other user from incoming message
      if (data.sender_id !== user?.id) {
        setOtherUser(prev => prev || {
          id: data.sender_id,
          name: data.sender_name,
          role: data.sender_role,
        });
      }
    } else if (data.event === 'typing') {
      setOtherTyping(data.typing);
    } else if (data.event === 'messages_read') {
      setMessages(prev => prev.map(m =>
        m.sender_id === user?.id ? { ...m, is_read: true } : m
      ));
    } else if (data.event === 'user_status') {
      setOtherOnline(data.online);
      if (!data.online && data.last_seen) setOtherLastSeen(data.last_seen);
    }
  }, [user]);

  const { connected, sendMessage, sendTyping, sendPrescription, markRead }
    = useChatWebSocket(roomId, handleWsMessage);

  // Mark read when opening chat
  useEffect(() => {
    if (connected) markRead();
  }, [connected, markRead]);

  // Auto-send prescription if navigated from prescription list
  useEffect(() => {
    if (prescriptionData && connected) {
      const content = `📋 Prescription #${prescriptionData.id}\nDiagnosis: ${prescriptionData.diagnosis}\nDate: ${new Date(prescriptionData.created_at).toLocaleDateString('en-IN')}`;
      sendPrescription(prescriptionData.id, content);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [prescriptionData, connected]); // eslint-disable-line

  // ── Typing indicator ──────────────────────────────────────────────
  const handleTextChange = (e) => {
    setText(e.target.value);
    sendTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => sendTyping(false), 1500);
  };

  // ── Send text ─────────────────────────────────────────────────────
  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Add message locally immediately for instant feedback
    const tempMsg = {
      id:         `temp-${Date.now()}`,
      sender_id:  user?.id,
      sender_name: user?.full_name || user?.name,
      sender_role: user?.role,
      msg_type:   'TEXT',
      content:    trimmed,
      is_read:    false,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    sendMessage(trimmed);
    setText('');
    sendTyping(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── File upload ───────────────────────────────────────────────────
  const uploadFile = async (file, msgType) => {
    // Optimistic temp message so sender sees it immediately
    const tempId = `temp-file-${Date.now()}`;
    const tempMsg = {
      id:          tempId,
      sender_id:   user?.id,
      sender_name: user?.full_name || user?.name,
      sender_role: user?.role,
      msg_type:    msgType,
      content:     '',
      file_url:    URL.createObjectURL(file),
      file_name:   file.name,
      file_size:   file.size,
      is_read:     false,
      created_at:  new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const res = await chatService.sendFile(roomId, file, msgType);
      // Replace temp with real message (WS broadcast will also arrive — deduplicate)
      setMessages(prev => {
        const without = prev.filter(m => m.id !== tempId);
        if (without.some(m => m.id === res.data.id)) return without;
        return [...without, res.data];
      });
    } catch {
      // Remove temp on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
      toast.error('File upload failed.');
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const msgType = type === 'image' ? 'IMAGE' : 'FILE';
    uploadFile(file, msgType);
    e.target.value = '';
  };

  // ── Voice recording ───────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr     = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        await uploadFile(file, 'VOICE');
      };
      mr.start();
      setMediaRecorder(mr);
      setRecording(true);
    } catch {
      toast.error('Microphone access denied.');
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setRecording(false);
    setMediaRecorder(null);
  };

  // ── Group messages by date ────────────────────────────────────────
  const groupedMessages = useMemo(() => {
    const groups = [];
    messages.forEach((msg, i) => {
      const prev = messages[i - 1];
      if (!prev || !sameDay(prev.created_at, msg.created_at)) {
        groups.push({ type: 'date', label: formatDate(msg.created_at), key: `d-${i}` });
      }
      groups.push({ type: 'msg', msg, key: msg.id || `m-${i}` });
    });
    return groups;
  }, [messages]);

  const onlineText = otherOnline
    ? 'Online'
    : otherLastSeen
      ? `Last seen ${new Date(otherLastSeen).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
      : '';

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b
                      border-gray-100 shadow-sm rounded-t-xl">
        <button onClick={() => navigate('/chat')}
          className="text-gray-400 hover:text-gray-600 transition-colors mr-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 19l-7-7 7-7"/>
          </svg>
        </button>

        {/* Avatar */}
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center
                          justify-center text-teal-700 font-semibold text-sm">
            {otherUser?.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full
            border-2 border-white ${otherOnline ? 'bg-green-400' : 'bg-gray-300'}`} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {otherUser?.name || '...'}
          </p>
          <p className={`text-xs ${otherOnline ? 'text-green-500' : 'text-gray-400'}`}>
            {onlineText}
          </p>
        </div>

        {/* Connection status */}
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}
          title={connected ? 'Connected' : 'Reconnecting...'} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 bg-gray-50 space-y-0.5">
        {loading ? (
          <div className="flex justify-center py-16">
            <svg className="animate-spin w-7 h-7 text-teal-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10"
                stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
        ) : (
          <>
            {groupedMessages.map(item => item.type === 'date' ? (
              <div key={item.key} className="flex items-center gap-3 my-3">
                <hr className="flex-1 border-gray-200"/>
                <span className="text-xs text-gray-400 font-medium px-2">{item.label}</span>
                <hr className="flex-1 border-gray-200"/>
              </div>
            ) : (
              <MessageBubble
                key={item.key}
                msg={item.msg}
                isMine={item.msg.sender_id === user?.id}
              />
            ))}
            {otherTyping && otherUser && (
              <TypingIndicator name={otherUser.name} />
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input bar */}
      <div className="bg-white border-t border-gray-100 px-3 py-2">
        {/* Hidden file inputs */}
        <input ref={fileInputRef} type="file" className="hidden"
          onChange={e => handleFileChange(e, 'file')} />
        <input ref={imgInputRef} type="file" accept="image/*" className="hidden"
          onChange={e => handleFileChange(e, 'image')} />
        <input ref={camInputRef} type="file" accept="image/*" capture="environment"
          className="hidden" onChange={e => handleFileChange(e, 'image')} />

        <div className="flex items-end gap-2">
          {/* Attachment buttons */}
          <div className="flex items-center gap-1 pb-1">
            {/* File */}
            <button onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-gray-400 hover:text-teal-500 transition-colors"
              title="Attach file">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0
                     00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
              </svg>
            </button>
            {/* Image gallery */}
            <button onClick={() => imgInputRef.current?.click()}
              className="p-1.5 text-gray-400 hover:text-teal-500 transition-colors"
              title="Send image">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0
                     012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2
                     2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </button>
            {/* Camera */}
            <button onClick={() => camInputRef.current?.click()}
              className="p-1.5 text-gray-400 hover:text-teal-500 transition-colors"
              title="Take photo">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0
                     0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07
                     7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </button>
          </div>

          {/* Text input */}
          <textarea
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-2.5
                       text-sm focus:outline-none focus:border-teal-400 bg-gray-50
                       max-h-32 leading-relaxed"
            style={{ height: 'auto', minHeight: '42px' }}
            onInput={e => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
            }}
          />

          {/* Voice / Send */}
          {text.trim() ? (
            <button onClick={handleSend}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-teal-500 hover:bg-teal-600
                         flex items-center justify-center transition-colors shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            </button>
          ) : (
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center
                justify-center transition-colors shadow-sm
                ${recording
                  ? 'bg-red-500 animate-pulse'
                  : 'bg-gray-100 hover:bg-gray-200'}`}
              title="Hold to record voice">
              <svg className={`w-5 h-5 ${recording ? 'text-white' : 'text-gray-500'}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3
                     3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
              </svg>
            </button>
          )}
        </div>
        {recording && (
          <p className="text-xs text-red-500 text-center mt-1 animate-pulse">
            🔴 Recording... Release to send
          </p>
        )}
      </div>
    </div>
  );
}

export default ChatPage;