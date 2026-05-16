import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export async function parseFile(file: File, bankProfileId = 'generico'): Promise<{ date: string; amount: number }[]> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bankProfileId', bankProfileId);
  const { data } = await api.post('/parse-file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.transactions;
}

export default api;
