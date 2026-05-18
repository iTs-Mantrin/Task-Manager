import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

let authToken = '';

export function setAuthToken(token) {
  authToken = token || '';
}

api.interceptors.request.use((config) => {
  const nextConfig = { ...config };

  if (authToken) {
    nextConfig.headers = {
      ...nextConfig.headers,
      Authorization: `Bearer ${authToken}`,
    };
  }

  return nextConfig;
});

export function getApiError(error, fallback = 'Something went wrong') {
  if (error.response?.data?.errors?.length) {
    return error.response.data.errors.map((entry) => entry.message).join(', ');
  }

  return error.response?.data?.message || error.message || fallback;
}

export const authApi = {
  signup: (payload) => api.post('/auth/signup', payload),
  login: (payload) => api.post('/auth/login', payload),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const teamApi = {
  list: () => api.get('/teams'),
  detail: (teamId) => api.get(`/teams/${teamId}`),
  create: (payload) => api.post('/teams', payload),
  update: (teamId, payload) => api.patch(`/teams/${teamId}`, payload),
  remove: (teamId) => api.delete(`/teams/${teamId}`),
  addMember: (teamId, payload) => api.post(`/teams/${teamId}/members`, payload),
  updateMember: (teamId, userId, payload) => api.patch(`/teams/${teamId}/members/${userId}`, payload),
  removeMember: (teamId, userId) => api.delete(`/teams/${teamId}/members/${userId}`),
};

export const projectApi = {
  list: (params) => api.get('/projects', { params }),
  detail: (projectId) => api.get(`/projects/${projectId}`),
  create: (payload) => api.post('/projects', payload),
  update: (projectId, payload) => api.patch(`/projects/${projectId}`, payload),
  remove: (projectId) => api.delete(`/projects/${projectId}`),
};

export const taskApi = {
  list: (params) => api.get('/tasks', { params }),
  detail: (taskId) => api.get(`/tasks/${taskId}`),
  create: (payload) => api.post('/tasks', payload),
  update: (taskId, payload) => api.patch(`/tasks/${taskId}`, payload),
  remove: (taskId) => api.delete(`/tasks/${taskId}`),
};

export const dashboardApi = {
  summary: () => api.get('/dashboard/summary'),
};

export const userApi = {
  list: () => api.get('/users'),
  create: (payload) => api.post('/users', payload),
  update: (userId, payload) => api.patch(`/users/${userId}`, payload),
  remove: (userId) => api.delete(`/users/${userId}`),
  profile: () => api.get('/users/profile'),
  updateProfile: (payload) => api.patch('/users/profile', payload),
  changePassword: (payload) => api.patch('/users/profile/password', payload),
};

export const activityLogApi = {
  listMine: () => api.get('/activity-logs/me'),
  listMembers: (params) => api.get('/activity-logs/members', { params }),
};

export const sessionApi = {
  listMine: () => api.get('/sessions/me'),
  terminate: (sessionId) => api.delete(`/sessions/${sessionId}`),
  terminateAllOther: () => api.delete('/sessions/other'),
};

export default api;
