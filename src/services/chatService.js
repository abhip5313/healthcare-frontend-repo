import api from './api';

const chatService = {

  // Get all rooms for current user
  getRooms: async () => {
    const res = await api.get('/chat/rooms/');
    return res.data;
  },

  // Get or create a room
  getOrCreateRoom: async (payload) => {
    const res = await api.post('/chat/room/', payload);
    return res.data;
  },

  // Get messages in a room
  getMessages: async (roomId) => {
    const res = await api.get(`/chat/rooms/${roomId}/messages/`);
    return res.data;
  },

  // Upload file/image/voice
  sendFile: async (roomId, file, msgType = 'FILE', content = '') => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('msg_type', msgType);
    fd.append('content', content);
    const res = await api.post(`/chat/rooms/${roomId}/send-file/`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Mark messages read
  markRead: async (roomId) => {
    const res = await api.post(`/chat/rooms/${roomId}/mark-read/`);
    return res.data;
  },

  // Total unread count
  getUnreadCount: async () => {
    const res = await api.get('/chat/unread-count/');
    return res.data;
  },
};

export default chatService;