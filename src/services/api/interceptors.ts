import { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

import { getAccessToken } from '../storage/secureStore';

export function setupAuthInterceptors(
  client: AxiosInstance,
  onUnauthorized?: () => void,
): void {
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await getAccessToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error: AxiosError) => Promise.reject(error),
  );

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401 && onUnauthorized) {
        onUnauthorized();
      }

      return Promise.reject(error);
    },
  );
}
