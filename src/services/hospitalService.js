import api from './api';

const hospitalService = {

  // Hospital Admin — register hospital
  registerHospital: async (formData) => {
    const response = await api.post('/hospitals/register/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Get my hospital (Hospital Admin)
  getMyHospital: async () => {
    const response = await api.get('/hospitals/my-hospital/');
    return response.data;
  },

  // Update my hospital
  updateMyHospital: async (formData) => {
    const response = await api.patch('/hospitals/my-hospital/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Upload document
  uploadDocument: async (formData) => {
    const response = await api.post('/hospitals/my-hospital/documents/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Public — list approved hospitals
  listHospitals: async (params = {}) => {
    const response = await api.get('/hospitals/', { params });
    return response.data;
  },

  // Get single hospital
  getHospital: async (id) => {
    const response = await api.get(`/hospitals/${id}/`);
    return response.data;
  },

  // Super Admin — pending hospitals
  getPendingHospitals: async () => {
    const response = await api.get('/hospitals/pending/');
    return response.data;
  },

  // Super Admin — approve or reject
  approveReject: async (id, action, rejection_reason = '') => {
    const response = await api.post(`/hospitals/${id}/approve-reject/`, {
      action,
      rejection_reason,
    });
    return response.data;
  },

  // Super Admin — stats
  getStats: async () => {
    const response = await api.get('/hospitals/stats/');
    return response.data;
  },

  // Super Admin — blacklist
  blacklistHospital: async (hospitalId, reason) => {
    const res = await api.post(`/hospitals/${hospitalId}/blacklist/`, {
      reason,
    });
    return res.data;
  },

  // Super Admin — unblacklist
  unblacklistHospital: async (hospitalId) => {
    const res = await api.post(`/hospitals/${hospitalId}/unblacklist/`);
    return res.data;
  },
};

export default hospitalService;