import axios from 'axios';

import { ENV } from '../../config/env';
import { setupAuthInterceptors } from './interceptors';

export const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

setupAuthInterceptors(apiClient);
