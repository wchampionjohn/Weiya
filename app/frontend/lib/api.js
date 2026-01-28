import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// Loading state management
let loadingCount = 0;
let loadingListeners = [];

export const loadingManager = {
  subscribe: (listener) => {
    loadingListeners.push(listener);
    return () => {
      loadingListeners = loadingListeners.filter(l => l !== listener);
    };
  },
  isLoading: () => loadingCount > 0,
};

const notifyListeners = () => {
  loadingListeners.forEach(listener => listener(loadingCount > 0));
};

api.interceptors.request.use((config) => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }

  // Increment loading count
  loadingCount++;
  notifyListeners();

  return config;
});

// Session expiration event
export const SESSION_EXPIRED_EVENT = 'admin:session-expired';

api.interceptors.response.use(
  (response) => {
    loadingCount = Math.max(0, loadingCount - 1);
    notifyListeners();
    return response;
  },
  (error) => {
    loadingCount = Math.max(0, loadingCount - 1);
    notifyListeners();

    if (error.response?.status === 401) {
      // Clear localStorage and dispatch session expired event
      localStorage.removeItem('admin');
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  }
);

export const adminApi = {
  login: (email, password) => api.post('/admin/session', { email, password }),
  logout: () => api.delete('/admin/session'),

  // Departments
  getDepartments: () => api.get('/admin/departments'),

  // Prize Types
  getPrizeTypes: () => api.get('/admin/prize_types'),
  createPrizeType: (data) => api.post('/admin/prize_types', { prize_type: data }),
  updatePrizeType: (id, data) => api.patch(`/admin/prize_types/${id}`, { prize_type: data }),
  deletePrizeType: (id) => api.delete(`/admin/prize_types/${id}`),
  checkPrizeTypeUsage: (id) => api.get(`/admin/prize_types/${id}/check_usage`),

  // Events
  getEvents: () => api.get('/admin/events'),
  getEvent: (id) => api.get(`/admin/events/${id}`),
  createEvent: (data) => api.post('/admin/events', { event: data }),
  updateEvent: (id, data) => api.patch(`/admin/events/${id}`, { event: data }),
  deleteEvent: (id) => api.delete(`/admin/events/${id}`),
  publishEvent: (id) => api.post(`/admin/events/${id}/publish`),
  completeEvent: (id) => api.post(`/admin/events/${id}/complete`),
  generateSlug: (id) => api.post(`/admin/events/${id}/generate_slug`),
  clearSlug: (id) => api.delete(`/admin/events/${id}/clear_slug`),
  copyEvent: (id, data = {}) => api.post(`/admin/events/${id}/copy`, { event: data }),
  previewNotification: (id, templateType, sampleData = {}) => api.post(`/admin/events/${id}/preview_notification`, { template_type: templateType, sample_data: sampleData }),

  // Prizes
  createPrize: (eventId, data) => api.post(`/admin/events/${eventId}/prizes`, { prize: data }),
  updatePrize: (eventId, prizeId, data) => api.patch(`/admin/events/${eventId}/prizes/${prizeId}`, { prize: data }),
  deletePrize: (eventId, prizeId) => api.delete(`/admin/events/${eventId}/prizes/${prizeId}`),
  reorderPrizes: (eventId, updates) => api.patch(`/admin/events/${eventId}/prizes/reorder`, { prizes: updates }),
  createBonusPrize: (eventId, data) => api.post(`/admin/events/${eventId}/prizes/bonus`, { prize: data }),

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
  simulateDraw: (prizeId, count) => api.post(`/admin/prizes/${prizeId}/draw`, { count, simulate: true }),

  // Eligibility (Phase 2)
  getEligibleParticipants: (eventId, prizeId) => api.get(`/admin/events/${eventId}/prizes/${prizeId}/eligible_participants`),
  previewEligibleParticipants: (eventId, rules) => api.post(`/admin/events/${eventId}/preview_eligible_participants`, { eligibility_rules: rules }),

  // Winners
  getWinners: (eventId, options = {}) => api.get('/admin/winners', { params: { event_id: eventId, ...options } }),
  updateWinner: (winnerId, data) => api.patch(`/admin/winners/${winnerId}`, data),
  batchDistributeWinners: (options) => api.post('/admin/winners/batch_distribute', options),

  // Notification Templates
  getNotificationTemplates: (params = {}) => api.get('/admin/notification_templates', { params }),
  getNotificationTemplate: (id) => api.get(`/admin/notification_templates/${id}`),
  createNotificationTemplate: (data) => api.post('/admin/notification_templates', { notification_template: data }),
  updateNotificationTemplate: (id, data) => api.patch(`/admin/notification_templates/${id}`, { notification_template: data }),
  deleteNotificationTemplate: (id) => api.delete(`/admin/notification_templates/${id}`),
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
