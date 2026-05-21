import api from './api';

const appointmentService = {

  // Patient — book appointment
  bookAppointment: async (data) => {
    const response = await api.post('/appointments/book/', data);
    return response.data;
  },

  // Patient — my appointments
  getMyAppointments: async (params = {}) => {
    const response = await api.get('/appointments/my-appointments/', { params });
    return response.data;
  },

  // Doctor — their appointments
  getDoctorAppointments: async (params = {}) => {
    const response = await api.get('/appointments/doctor-appointments/', { params });
    return response.data;
  },

  // Both — single appointment detail
  getAppointment: async (id) => {
    const response = await api.get(`/appointments/${id}/`);
    return response.data;
  },

  // Update status (confirm / cancel / complete / reject)
  updateStatus: async (id, status, extra = {}) => {
    const response = await api.post(`/appointments/${id}/update-status/`, {
      status, ...extra,
    });
    return response.data;
  },

  // Patient — reschedule
  reschedule: async (id, appointment_date, appointment_time) => {
    const response = await api.post(`/appointments/${id}/reschedule/`, {
      appointment_date, appointment_time,
    });
    return response.data;
  },

  // Join meeting — marks meeting_joined_at + returns Daily.co token
  joinMeeting: async (id) => {
    const response = await api.post(`/appointments/${id}/join-meeting/`);
    return response.data;
  },

  // Hospital Admin — hospital च्या सगळ्या appointments
  getHospitalAppointments: async (params = {}) => {
    const response = await api.get('/appointments/hospital-appointments/', { params });
    return response.data;
  },

  // Stats
  getStats: async () => {
    const response = await api.get('/appointments/stats/');
    return response.data;
  },
};

export default appointmentService;