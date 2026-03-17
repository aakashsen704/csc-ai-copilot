import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor
api.interceptors.request.use(config => {
  const operatorId = localStorage.getItem('operatorId') || 'default';
  config.headers['X-Operator-Id'] = operatorId;
  return config;
});

// Response interceptor
api.interceptors.response.use(
  res => res.data,
  err => {
    if (!err.response) throw new Error('NETWORK_ERROR');
    throw err.response.data || err;
  }
);

// AI endpoints
export const aiAPI = {
  chat: (message, context) => api.post('/ai/chat', { message, ...context }),
  analyze: (serviceType, formData, documents) => api.post('/ai/analyze', { serviceType, formData, documents }),
  fieldHint: (fieldName, fieldValue, serviceType) => api.post('/ai/field-hint', { fieldName, fieldValue, serviceType })
};

// Validation endpoints
export const validateAPI = {
  aadhaar: (value) => api.post('/validate/aadhaar', { value }),
  ifsc: (value) => api.post('/validate/ifsc', { value }),
  mobile: (value) => api.post('/validate/mobile', { value }),
  age: (dob, serviceType) => api.post('/validate/age', { dob, serviceType }),
  pincode: (value) => api.post('/validate/pincode', { value }),
  form: (formData, serviceType) => api.post('/validate/form', { formData, serviceType })
};

// Applications
export const appAPI = {
  create: (serviceType, formData) => api.post('/applications', { serviceType, formData }),
  get: (id) => api.get(`/applications/${id}`),
  update: (id, data) => api.put(`/applications/${id}`, data),
  submit: (id) => api.post(`/applications/${id}/submit`),
  list: (params) => api.get('/applications', { params })
};

// Analytics
export const analyticsAPI = {
  rejectionPatterns: (serviceType) => api.get('/analytics/rejection-patterns', { params: { serviceType } }),
  dashboard: () => api.get('/analytics/dashboard'),
  serviceStats: () => api.get('/analytics/service-stats')
};

// Services
export const servicesAPI = {
  list: () => api.get('/services'),
  get: (serviceType) => api.get(`/services/${serviceType}`)
};

export default api;
