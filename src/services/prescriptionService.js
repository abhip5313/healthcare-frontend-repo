import api from './api';

const prescriptionService = {

  // Doctor — create prescription (JSON पाठवतो, FormData नाही)
  createPrescription: async (data) => {
    const response = await api.post('/prescriptions/create/', data, {
      headers: { 'Content-Type': 'application/json' },  // ← JSON
    });
    return response.data;
  },

  // Patient — my prescriptions
  getMyPrescriptions: async () => {
    const response = await api.get('/prescriptions/my-prescriptions/');
    return response.data;
  },

  // Doctor — prescriptions I wrote
  getDoctorPrescriptions: async () => {
    const response = await api.get('/prescriptions/doctor-prescriptions/');
    return response.data;
  },

  // Both — single prescription
  getPrescription: async (id) => {
    const response = await api.get(`/prescriptions/${id}/`);
    return response.data;
  },
};

export default prescriptionService;