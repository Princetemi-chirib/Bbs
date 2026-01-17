import axios from 'axios';

// Use relative path for Vercel deployment (same domain), or absolute for separate backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

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

// Product API functions
export const productApi = {
  getAll: async (category?: string) => {
    const params = category ? `?category=${category}` : '';
    const response = await apiClient.get(`/products${params}`);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  create: async (productData: {
    title: string;
    description?: string;
    adultPrice: number;
    kidsPrice?: number;
    category: 'general' | 'recovery';
    beforeImage: string;
    afterImage: string;
    isActive?: boolean;
    displayOrder?: number;
  }) => {
    const response = await apiClient.post('/products', productData);
    return response.data;
  },

  update: async (id: string, productData: any) => {
    const response = await apiClient.put(`/products/${id}`, productData);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },
};

// Order API functions
export const orderApi = {
  create: async (orderData: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    city: string;
    location: string;
    address?: string;
    additionalNotes?: string;
    items: Array<{
      productId: string;
      title: string;
      quantity: number;
      ageGroup: string;
      unitPrice: number;
      totalPrice: number;
    }>;
    totalAmount: number;
    paymentReference?: string;
    paymentMethod?: string;
  }) => {
    const response = await apiClient.post('/orders', orderData);
    return response.data;
  },

  getAll: async (params?: { status?: string; limit?: number; offset?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const queryString = queryParams.toString();
    const response = await apiClient.get(`/orders${queryString ? `?${queryString}` : ''}`);
    return response.data;
  },
};

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
