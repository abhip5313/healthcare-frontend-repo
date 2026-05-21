import api from './api';

const reviewService = {

  // Doctor Reviews
  submitDoctorReview: async (data) => {
    const response = await api.post('/reviews/doctor/', data);
    return response.data;
  },

  getDoctorReviews: async (doctorId) => {
    const response = await api.get(`/reviews/doctor/${doctorId}/`);
    return response.data;
  },

  deleteDoctorReview: async (id) => {
    const response = await api.delete(`/reviews/doctor/${id}/delete/`);
    return response.data;
  },

  // Hospital Reviews
  submitHospitalReview: async (data) => {
    const response = await api.post('/reviews/hospital/', data);
    return response.data;
  },

  getHospitalReviews: async (hospitalId) => {
    const response = await api.get(`/reviews/hospital/${hospitalId}/`);
    return response.data;
  },

  deleteHospitalReview: async (id) => {
    const response = await api.delete(`/reviews/hospital/${id}/delete/`);
    return response.data;
  },
};

export default reviewService;