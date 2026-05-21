import api from './api';

const medicalRecordService = {

  // Patient — upload record
  uploadRecord: async (formData) => {
    const response = await api.post('/prescriptions/records/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Patient — my records
  getMyRecords: async (params = {}) => {
    const response = await api.get('/prescriptions/records/', { params });
    return response.data;
  },

  // Doctor — patient records
  getPatientRecords: async (patientId) => {
    const response = await api.get(`/prescriptions/records/patient/${patientId}/`);
    return response.data;
  },

  // Patient — delete record
  deleteRecord: async (id) => {
    const response = await api.delete(`/prescriptions/records/${id}/`);
    return response.data;
  },
};

export default medicalRecordService;