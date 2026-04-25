import { create } from 'zustand';

import apiClient from '../api/apiClient';
import { PropertyModel } from '../types/property';
import { UserModel } from '../types/user';

type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

interface DashboardState {
  myProperties: PropertyModel[];
  applications: any[];
  maintenance: any[];
  transactions: any[];
  leases: any[];
  favorites: any[];
  users: UserModel[];
  isLoading: boolean;
  error: string | null;

  fetchCustomerData: (userId: string) => Promise<void>;
  fetchOwnerData: (userId: string) => Promise<void>;
  fetchAgentData: (userId: string) => Promise<void>;
  fetchAdminData: () => Promise<void>;
  updateApplicationStatus: (
    id: string,
    status: ApplicationStatus,
  ) => Promise<void>;
  updateMaintenanceStatus: (id: string, status: string) => Promise<void>;
  createMaintenanceRequest: (payload: {
    propertyId: string;
    category: string;
    description: string;
    images?: string[];
  }) => Promise<void>;
  toggleFavorite: (propertyId: string) => Promise<void>;
  deleteProperty: (propertyId: string) => Promise<void>;
  fetchUsers: () => Promise<void>;
}

const ensureArray = <T>(value: any): T[] =>
  Array.isArray(value)
    ? value
    : Array.isArray(value?.applications)
    ? value.applications
    : Array.isArray(value?.requests)
    ? value.requests
    : Array.isArray(value?.transactions)
    ? value.transactions
    : Array.isArray(value?.leases)
    ? value.leases
    : Array.isArray(value?.properties)
    ? value.properties
    : [];

export const useDashboardStore = create<DashboardState>((set, get) => ({
  myProperties: [],
  applications: [],
  maintenance: [],
  transactions: [],
  leases: [],
  favorites: [],
  users: [],
  isLoading: false,
  error: null,

  fetchCustomerData: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const [appsRes, maintRes, txRes, leaseRes, favRes] = await Promise.all([
        apiClient.get('/api/applications', { params: { customerId: userId } }),
        apiClient.get('/api/maintenance'),
        apiClient.get('/api/transactions'),
        apiClient.get('/api/leases', { params: { userId } }),
        apiClient.get('/api/favorites'),
      ]);

      set({
        myProperties: [],
        applications: ensureArray<any>(appsRes.data),
        maintenance: ensureArray<any>(maintRes.data),
        transactions: ensureArray<any>(txRes.data),
        leases: ensureArray<any>(leaseRes.data),
        favorites: ensureArray<any>(favRes.data),
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err?.response?.data?.error || err?.message || 'Failed to load dashboard',
        isLoading: false,
      });
    }
  },

  fetchOwnerData: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const [propsRes, appsRes, maintRes, txRes, leaseRes] = await Promise.all([
        apiClient.get(`/api/properties/owner/${userId}`),
        apiClient.get('/api/applications', { params: { managerId: userId } }),
        apiClient.get('/api/maintenance'),
        apiClient.get('/api/transactions'),
        apiClient.get('/api/leases', { params: { userId } }),
      ]);

      set({
        myProperties: ensureArray<PropertyModel>(propsRes.data),
        applications: ensureArray<any>(appsRes.data),
        maintenance: ensureArray<any>(maintRes.data),
        transactions: ensureArray<any>(txRes.data),
        leases: ensureArray<any>(leaseRes.data),
        favorites: [],
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err?.response?.data?.error || err?.message || 'Failed to load dashboard',
        isLoading: false,
      });
    }
  },

  fetchAgentData: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const [propsRes, appsRes, txRes, leaseRes] = await Promise.all([
        apiClient.get(`/api/properties/owner/${userId}`),
        apiClient.get('/api/applications', { params: { managerId: userId } }),
        apiClient.get('/api/transactions'),
        apiClient.get('/api/leases', { params: { userId } }),
      ]);

      set({
        myProperties: ensureArray<PropertyModel>(propsRes.data),
        applications: ensureArray<any>(appsRes.data),
        maintenance: [],
        transactions: ensureArray<any>(txRes.data),
        leases: ensureArray<any>(leaseRes.data),
        favorites: [],
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err?.response?.data?.error || err?.message || 'Failed to load dashboard',
        isLoading: false,
      });
    }
  },

  fetchAdminData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [propsRes, appsRes, maintRes, txRes, leaseRes, usersRes] =
        await Promise.all([
          apiClient.get('/api/properties', { params: { limit: 100 } }),
          apiClient.get('/api/applications'),
          apiClient.get('/api/maintenance'),
          apiClient.get('/api/transactions'),
          apiClient.get('/api/leases'),
          apiClient.get('/api/user'),
        ]);

      set({
        myProperties: ensureArray<PropertyModel>(propsRes.data),
        applications: ensureArray<any>(appsRes.data),
        maintenance: ensureArray<any>(maintRes.data),
        transactions: ensureArray<any>(txRes.data),
        leases: ensureArray<any>(leaseRes.data),
        favorites: [],
        users: ensureArray<UserModel>(usersRes.data),
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err?.response?.data?.error || err?.message || 'Failed to load dashboard',
        isLoading: false,
      });
    }
  },

  updateApplicationStatus: async (id, status) => {
    await apiClient.patch(`/api/applications/${id}`, { status });
    set((state) => ({
      applications: state.applications.map((application) =>
        application.id === id ? { ...application, status } : application,
      ),
    }));
  },

  updateMaintenanceStatus: async (id, status) => {
    const response = await apiClient.patch(`/api/maintenance/${id}`, { status });
    const nextRequest = response.data;

    set((state) => ({
      maintenance: state.maintenance.map((request) =>
        request.id === id ? { ...request, ...nextRequest } : request,
      ),
    }));
  },

  createMaintenanceRequest: async (payload) => {
    const response = await apiClient.post('/api/maintenance', payload);
    set((state) => ({
      maintenance: [response.data, ...state.maintenance],
    }));
  },

  toggleFavorite: async (propertyId) => {
    const { favorites } = get();
    const isFavorite = favorites.some((f) => (f.propertyId === propertyId || f.property?.id === propertyId));

    try {
      if (isFavorite) {
        await apiClient.delete(`/api/favorites/${propertyId}`);
        set((state) => ({
          favorites: state.favorites.filter((f) => (f.propertyId !== propertyId && f.property?.id !== propertyId)),
        }));
      } else {
        const response = await apiClient.post('/api/favorites', { propertyId });
        set((state) => ({
          favorites: [response.data, ...state.favorites],
        }));
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      throw err;
    }
  },
  deleteProperty: async (propertyId) => {
    try {
      await apiClient.delete(`/api/properties/${propertyId}`);
      set((state) => ({
        myProperties: state.myProperties.filter((p) => p.id !== propertyId),
      }));
    } catch (err: any) {
      console.error('Failed to delete property:', err);
      throw err;
    }
  },
  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get('/api/user');
      set({ users: ensureArray<UserModel>(response.data), isLoading: false });
    } catch (err: any) {
      set({
        error: err?.response?.data?.error || err?.message || 'Failed to load users',
        isLoading: false,
      });
    }
  },
}));
