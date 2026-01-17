import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// Email API functions
export const emailApi = {
  sendOrderConfirmation: async (orderData: {
    customerName: string;
    customerEmail: string;
    orderReference: string;
    items: Array<{
      title: string;
      quantity: number;
      price: number;
      displayAge?: string;
    }>;
    total: number;
    city: string;
    location: string;
    address?: string;
    phone: string;
    paymentReference?: string;
  }) => {
    const response = await apiClient.post('/emails/order-confirmation', orderData);
    return response.data;
  },

  sendTestEmail: async (to: string) => {
    const response = await apiClient.post('/emails/test', { to });
    return response.data;
  },
};
