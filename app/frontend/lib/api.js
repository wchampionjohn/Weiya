import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear localStorage to sync auth state with server
      localStorage.removeItem('admin');
      // Only redirect if not already on admin page (to avoid loop)
      if (!window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin';
      }
    }
    return Promise.reject(error);
  }
);

export const adminApi = {
  login: (email, password) => api.post('/admin/session', { email, password }),
  logout: () => api.delete('/admin/session'),

  // Events
  getEvents: () => api.get('/admin/events'),
  getEvent: (id) => api.get(`/admin/events/${id}`),
  createEvent: (data) => api.post('/admin/events', { event: data }),
  updateEvent: (id, data) => api.patch(`/admin/events/${id}`, { event: data }),
  deleteEvent: (id) => api.delete(`/admin/events/${id}`),
  publishEvent: (id) => api.post(`/admin/events/${id}/publish`),

  // Prizes
  createPrize: (eventId, data) => api.post(`/admin/events/${eventId}/prizes`, { prize: data }),
  updatePrize: (eventId, prizeId, data) => api.patch(`/admin/events/${eventId}/prizes/${prizeId}`, { prize: data }),
  deletePrize: (eventId, prizeId) => api.delete(`/admin/events/${eventId}/prizes/${prizeId}`),
  reorderPrizes: (eventId, updates) => api.patch(`/admin/events/${eventId}/prizes/reorder`, { prizes: updates }),

  // Global Participants
  getAllParticipants: (params = {}) => api.get('/admin/participants', { params }),
  getParticipant: (id) => api.get(`/admin/participants/${id}`),
  createParticipant: (data) => api.post('/admin/participants', { participant: data }),
  updateParticipant: (id, data) => api.patch(`/admin/participants/${id}`, { participant: data }),
  deleteParticipant: (id) => api.delete(`/admin/participants/${id}`),

  // Event Participants
  getEventParticipants: (eventId) => api.get(`/admin/events/${eventId}/participants`),
  addParticipantToEvent: (eventId, participantId) => api.post(`/admin/events/${eventId}/participants/${participantId}/add`),
  removeParticipantFromEvent: (eventId, participantId) => api.delete(`/admin/events/${eventId}/participants/${participantId}/remove`),
  importParticipants: (eventId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/admin/events/${eventId}/participants/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Draw
  executeDraw: (prizeId, count) => api.post(`/admin/prizes/${prizeId}/draw`, { count }),

  // Winners
  getWinners: (eventId, options = {}) => api.get('/admin/winners', { params: { event_id: eventId, ...options } }),
  updateWinner: (winnerId, data) => api.patch(`/admin/winners/${winnerId}`, data),
};

export const publicApi = {
  getEvent: (id) => api.get(`/public/events/${id}`),
  getEventStatus: (id) => api.get(`/public/events/${id}/status`),
  verifyEvent: (id, password) => api.post(`/public/events/${id}/verify`, { password }),
  getEventWinners: (eventId) => api.get(`/public/events/${eventId}/winners`),
  checkMyResults: (eventId, data) => api.post(`/public/events/${eventId}/check`, data),
  login: (eventId, field, value) => api.post('/public/session', { event_id: eventId, field, value }),
  logout: () => api.delete('/public/session'),
};

export default api;
