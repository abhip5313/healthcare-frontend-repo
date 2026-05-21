import api from './api';

const notificationService = {

  // Get all notifications (last 50)
  getAll: async () => {
    const response = await api.get('/notifications/');
    return response.data;
  },

  // Get only unread count — lightweight, used for bell badge polling
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count/');
    return response.data;
  },

  // Mark notifications as read
  // pass ids array to mark specific ones, empty to mark all
  markRead: async (ids = []) => {
    const response = await api.post('/notifications/mark-read/', { ids });
    return response.data;
  },
};

export default notificationService;