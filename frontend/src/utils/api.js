import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const customerAPI = {
  getAll: () => api.get('/customers'),
  search: (query) => api.get(`/customers/search?query=${query}`),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  getHistory: (id) => api.get(`/customers/${id}/history`),
  getBirthdays: () => api.get('/customers/birthdays'),
};

export const itemAPI = {
  getAll: () => api.get('/items'),
  getActive: () => api.get('/items/active'),
  create: (data) => api.post('/items', data),
  update: (id, data) => api.put(`/items/${id}`, data),
  delete: (id) => api.delete(`/items/${id}`),
  toggleStatus: (id) => api.patch(`/items/${id}/toggle`),
  getCategories: () => api.get('/items/categories'),
  createCategory: (data) => api.post('/items/categories', data),
  deleteCategory: (id) => api.delete(`/items/categories/${id}`),
};

export const billAPI = {
  getAll: () => api.get('/bills'),
  getById: (id) => api.get(`/bills/${id}`),
  create: (data) => api.post('/bills', data),
  update: (id, data) => api.put(`/bills/${id}`),
  delete: (id) => api.delete(`/bills/${id}`),
  download: (id) => api.get(`/bills/${id}/download`, { responseType: 'blob' }),
  sendWhatsApp: (id) => api.post(`/bills/${id}/whatsapp`),
};

export const reportAPI = {
  getDashboard: () => api.get('/reports/dashboard'),
  getDailyRevenue: (date) => api.get(`/reports/daily?date=${date}`),
  getMonthlyRevenue: (month, year) => api.get(`/reports/monthly?month=${month}&year=${year}`),
  getTopItems: (limit) => api.get(`/reports/top-services?limit=${limit}`),
  getRepeatCustomers: () => api.get('/reports/repeat-customers'),
  exportRevenue: (startDate, endDate) => api.get(`/reports/export?startDate=${startDate}&endDate=${endDate}`, { responseType: 'blob' }),
};

export default api;
