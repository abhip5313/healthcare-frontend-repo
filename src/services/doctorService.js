import api from './api';

const doctorService = {

  registerDoctor: async (formData) => {
    const response = await api.post('/doctors/register/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getMyProfile: async () => {
    const response = await api.get('/doctors/my-profile/');
    return response.data;
  },

  updateMyProfile: async (formData) => {
    const response = await api.patch('/doctors/my-profile/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  listDoctors: async (params = {}) => {
    const response = await api.get('/doctors/', { params });

    // Handle both paginated and custom responses
    const raw = response.data;

    return {
      data:  raw.results || raw.data || [],
      count: raw.count   || 0,
    };
  },

  getDoctor: async (id) => {
    const response = await api.get(`/doctors/${id}/`);
    return response.data;
  },

  // Hospital Admin — doctors list
  getHospitalDoctors: async () => {
    const response = await api.get('/doctors/hospital-doctors/');
    const raw = response.data;

    return {
      data:  raw.results || raw.data || [],
      count: raw.count   || 0,
    };
  },

  // Pending doctors
  getPendingDoctors: async () => {
    const response = await api.get('/doctors/pending/');
    const raw = response.data;

    return {
      data:  raw.results || raw.data || [],
      count: raw.count   || 0,
    };
  },

  // NEW — manage doctors with tabs
  manageDoctors: async (tab = 'all') => {
    const response = await api.get('/doctors/manage/', {
      params: { tab },
    });

    return response.data;
  },

  // Approve / Reject
  approveReject: async (id, action, rejection_reason = '') => {
    const response = await api.post(`/doctors/${id}/approve-reject/`, {
      action,
      rejection_reason,
    });

    return response.data;
  },

  // NEW — blacklist doctor
  blacklistDoctor: async (id, reason) => {
    const response = await api.post(`/doctors/${id}/blacklist/`, {
      reason,
    });

    return response.data;
  },

  // NEW — unblacklist doctor
  unblacklistDoctor: async (id) => {
    const response = await api.post(`/doctors/${id}/unblacklist/`);

    return response.data;
  },

  // Slots
  getSlots: async () => {
    const response = await api.get('/doctors/slots/');
    return response.data;
  },

  addSlot: async (slotData) => {
    const response = await api.post('/doctors/slots/', slotData);
    return response.data;
  },

  deleteSlot: async (id) => {
    const response = await api.delete(`/doctors/slots/${id}/`);
    return response.data;
  },

  // Signature upload
  uploadSignature: async (file) => {
    const fd = new FormData();

    fd.append('signature', file);

    const response = await api.post(
      '/doctors/upload-signature/',
      fd,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  },

  // Signature delete
  deleteSignature: async () => {
    const response = await api.delete('/doctors/upload-signature/');
    return response.data;
  },


  // ── Leave Management (Doctor) ─────────────────────────────────────────────
  getMyLeaves: async () => {
    const response = await api.get('/doctors/leaves/');
    return response.data;
  },

  applyLeave: async (data) => {
    const response = await api.post('/doctors/leaves/', data);
    return response.data;
  },

  cancelLeave: async (id) => {
    const response = await api.delete(`/doctors/leaves/${id}/`);
    return response.data;
  },

  // ── Leave Management (Hospital Admin) ─────────────────────────────────────
  getAdminLeaves: async (status = '') => {
    const response = await api.get('/doctors/admin/leaves/', {
      params: status ? { status } : {},
    });
    return response.data;
  },

  adminLeaveAction: async (id, action, rejection_reason = '') => {
    const response = await api.post(`/doctors/admin/leaves/${id}/action/`, {
      action,
      rejection_reason,
    });
    return response.data;
  },

  // Stats
  getStats: async () => {
    const response = await api.get('/doctors/stats/');
    return response.data;
  },
};

export default doctorService;
// (appended by leave feature)
