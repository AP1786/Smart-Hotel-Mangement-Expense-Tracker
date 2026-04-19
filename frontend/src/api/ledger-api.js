import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8080',
  timeout: 15000,
});

export const ledgerApi = {
  async getDashboard() {
    const response = await api.get('/api/dashboard');
    return response.data;
  },

  async restockIngredient(payload) {
    const response = await api.post('/api/ledger/restocks', payload);
    return response.data;
  },

  async registerDish(payload) {
    const response = await api.post('/api/ledger/dishes', payload);
    return response.data;
  },

  async recordSale(payload) {
    const response = await api.post('/api/ledger/sales', payload);
    return response.data;
  },
};
