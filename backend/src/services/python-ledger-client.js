import axios from 'axios';

import { env } from '../config/env.js';
import { HttpError } from '../lib/http-error.js';

const client = axios.create({
  baseURL: `${env.pythonLedgerBaseUrl}/api/v1/ledger`,
  timeout: 15000,
});

const unwrapError = (error, fallbackMessage) => {
  if (error.response) {
    throw new HttpError(
      error.response.status,
      error.response.data?.detail ?? fallbackMessage,
      error.response.data,
    );
  }

  throw new HttpError(502, fallbackMessage, error.message);
};

export const pythonLedgerClient = {
  async getOverview() {
    try {
      const response = await client.get('/overview');
      return response.data;
    } catch (error) {
      unwrapError(error, 'Failed to read the Python ledger overview.');
    }
  },

  async listBlocks(limit = 50) {
    try {
      const response = await client.get('/blocks', { params: { limit } });
      return response.data;
    } catch (error) {
      unwrapError(error, 'Failed to read blocks from the Python ledger.');
    }
  },

  async restockIngredient(payload) {
    try {
      const response = await client.post('/restock', payload);
      return response.data;
    } catch (error) {
      unwrapError(error, 'Failed to restock an ingredient.');
    }
  },

  async registerDish(payload) {
    try {
      const response = await client.post('/dishes', payload);
      return response.data;
    } catch (error) {
      unwrapError(error, 'Failed to register a dish.');
    }
  },

  async recordSale(payload) {
    try {
      const response = await client.post('/sales', payload);
      return response.data;
    } catch (error) {
      unwrapError(error, 'Failed to record a dish sale.');
    }
  },
};
