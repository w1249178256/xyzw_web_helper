import axios from 'axios';

const authApi_instance = axios.create({
  baseURL: '/api/auth',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: attach Bearer token from localStorage
authApi_instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 globally
authApi_instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('auth_token');
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  // Auth endpoints
  login(username, password) {
    return authApi_instance.post('/login', { username, password });
  },

  register(username, password, invite_code) {
    return authApi_instance.post('/register', { username, password, invite_code });
  },

  me() {
    return authApi_instance.get('/me');
  },

  logout() {
    return authApi_instance.post('/logout');
  },

  // Token sync endpoints
  getTokens() {
    return authApi_instance.get('/tokens');
  },

  saveTokens(tokens) {
    return authApi_instance.put('/tokens', { tokens });
  },

  // Settings sync endpoints
  getSettings() {
    return authApi_instance.get('/settings');
  },

  saveSettings(settings) {
    return authApi_instance.put('/settings', { settings });
  },

  // Scheduled tasks endpoints
  getTasks() {
    return authApi_instance.get('/tasks');
  },

  createTask(task) {
    return authApi_instance.post('/tasks', task);
  },

  updateTask(id, task) {
    return authApi_instance.put(`/tasks/${id}`, task);
  },

  deleteTask(id) {
    return authApi_instance.delete(`/tasks/${id}`);
  },

  getTaskLogs() {
    return authApi_instance.get('/tasks/logs');
  },

  runTask(id) {
    return authApi_instance.post(`/tasks/${id}/run`);
  },

  // Token groups endpoints
  getTokenGroups() {
    return authApi_instance.get('/token-groups');
  },

  saveTokenGroups(groups) {
    return authApi_instance.put('/token-groups', { groups });
  },

  // Per-account daily settings endpoints
  getAccountSettings() {
    return authApi_instance.get('/account-settings');
  },

  saveAccountSettings(tokenId, settings) {
    return authApi_instance.put(`/account-settings/${tokenId}`, { settings });
  },

  // Task template endpoints
  getTemplates() {
    return authApi_instance.get('/templates');
  },

  createTemplate(template) {
    return authApi_instance.post('/templates', template);
  },

  updateTemplate(id, template) {
    return authApi_instance.put(`/templates/${id}`, template);
  },

  deleteTemplate(id) {
    return authApi_instance.delete(`/templates/${id}`);
  },

  // Admin endpoints
  admin: {
    getStats() {
      return authApi_instance.get('/admin/stats');
    },

    getUsers() {
      return authApi_instance.get('/admin/users');
    },

    deleteUser(id) {
      return authApi_instance.delete(`/admin/users/${id}`);
    },

    createInvite(expires_days = 7) {
      return authApi_instance.post('/admin/invite', { expires_days });
    },

    getInvites() {
      return authApi_instance.get('/admin/invites');
    }
  }
};

export default authApi;
