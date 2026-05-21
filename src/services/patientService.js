import api from './api';

const patientService = {

  // Doctor — माझ्या सगळ्या patients ची list
  getMyPatients: async () => {
    const res = await api.get('/appointments/my-patients/');
    return res.data;
  },

  // Doctor — एका patient चा पूर्ण detail
  getPatientDetail: async (patientId) => {
    const res = await api.get(`/appointments/my-patients/${patientId}/`);
    return res.data;
  },
};

export default patientService;