import api from './api';

const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login/', credentials);
    return response.data;
  },

  logout: async (refreshToken) => {
    const response = await api.post('/auth/logout/', { refresh: refreshToken });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile/');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.patch('/auth/profile/', profileData);
    return response.data;
  },

  changePassword: async (passwordData) => {
    const response = await api.post('/auth/change-password/', passwordData);
    return response.data;
  },

  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/token/refresh/', { refresh: refreshToken });
    return response.data;
  },

  healthCheck: async () => {
    const response = await api.get('/auth/health/');
    return response.data;
  },

  // Super Admin — list all users
  // params: { role, is_active, is_verified, search }
  getUsers: async (params = {}) => {
    const response = await api.get('/auth/users/', { params });
    return response.data;
  },

  // Super Admin — activate / deactivate a user
  toggleUserActive: async (userId) => {
    const response = await api.post(`/auth/users/${userId}/toggle-active/`);
    return response.data;
  },
};

export default authService;