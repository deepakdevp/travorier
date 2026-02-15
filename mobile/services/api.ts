/**
 * API client for backend communication
 */
import axios, { AxiosInstance } from 'axios';
import { supabase } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to attach auth token
    this.client.interceptors.request.use(
      async (config) => {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.access_token) {
          config.headers.Authorization = `Bearer ${session.access_token}`;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - maybe redirect to login
          supabase.auth.signOut();
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  auth = {
    signup: (data: { email: string; password: string; fullName: string }) =>
      this.client.post('/api/v1/auth/signup', data),

    login: (data: { email: string; password: string }) =>
      this.client.post('/api/v1/auth/login', data),

    getCurrentUser: () => this.client.get('/api/v1/auth/me'),
  };

  // Trip endpoints
  trips = {
    create: (data: any) => this.client.post('/api/v1/trips', data),
    search: (params: any) => this.client.get('/api/v1/trips', { params }),
    getById: (id: string) => this.client.get(`/api/v1/trips/${id}`),
    update: (id: string, data: any) =>
      this.client.patch(`/api/v1/trips/${id}`, data),
    delete: (id: string) => this.client.delete(`/api/v1/trips/${id}`),
  };

  // Request endpoints
  requests = {
    create: (data: any) => this.client.post('/api/v1/requests', data),
    search: (params: any) => this.client.get('/api/v1/requests', { params }),
    getById: (id: string) => this.client.get(`/api/v1/requests/${id}`),
    update: (id: string, data: any) =>
      this.client.patch(`/api/v1/requests/${id}`, data),
    delete: (id: string) => this.client.delete(`/api/v1/requests/${id}`),
  };

  // Match endpoints
  matches = {
    create: (data: any) => this.client.post('/api/v1/matches', data),
    list: () => this.client.get('/api/v1/matches'),
    getById: (id: string) => this.client.get(`/api/v1/matches/${id}`),
    unlock: (id: string) => this.client.post(`/api/v1/matches/${id}/unlock`),
    generateQR: (id: string) => this.client.post(`/api/v1/matches/${id}/qr`),
    scanQR: (id: string, qrCode: string) =>
      this.client.post(`/api/v1/matches/${id}/scan-qr`, { qrCode }),
  };

  // Payment endpoints
  payments = {
    createIntent: (data: any) =>
      this.client.post('/api/v1/payments/create-intent', data),
    getCredits: () => this.client.get('/api/v1/payments/credits'),
    buyCredits: (data: any) =>
      this.client.post('/api/v1/payments/buy-credits', data),
    getTransactions: () => this.client.get('/api/v1/payments/transactions'),
  };
}

export const api = new ApiClient();
