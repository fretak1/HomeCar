import axios from "axios";

export const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';

export const API_ROUTES = {
    AUTH: `${API_BASE_URL}/api/auth`,
    SERVICES: `${API_BASE_URL}/api/services`,
    EVENTS: `${API_BASE_URL}/api/events`,
    GUIDES: `${API_BASE_URL}/api/guides`,
    TASKS: `${API_BASE_URL}/api/tasks`,
    USER: `${API_BASE_URL}/api/user`,
    ORDER: `${API_BASE_URL}/api/order`,
    COMMENTS: `${API_BASE_URL}/api/messages`,
    NEWSLETTER: `${API_BASE_URL}/api/newsletter`,
    PAYMENT: `${API_BASE_URL}/api/payment`,
    BLOGS: `${API_BASE_URL}/api/blogs`,
    NOTIFICATIONS: `${API_BASE_URL}/api/notifications`,
    APPLICATIONS: `${API_BASE_URL}/api/applications`,
    SHIFTS: `${API_BASE_URL}/api/shifts`,
    LEASES: `${API_BASE_URL}/api/leases`,
    PROPERTIES: `${API_BASE_URL}/api/properties`,
    FAVORITES: `${API_BASE_URL}/api/favorites`,
    MAINTENANCE: `${API_BASE_URL}/api/maintenance`,
    REVIEWS: `${API_BASE_URL}/api/reviews`,
    DOCUMENTS: `${API_BASE_URL}/api/documents`,
    TRANSACTIONS: `${API_BASE_URL}/api/transactions`,
    CHATS: `${API_BASE_URL}/api/chats`,
    UPLOAD: `${API_BASE_URL}/api/upload`,
    INTERACTIONS: `${API_BASE_URL}/api/interactions`
};

export const createApi = (baseURL: string = API_BASE_URL || '') => {
    const api = axios.create({
        baseURL,
        withCredentials: true,
    });


    api.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('auth_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );


    api.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response?.status === 401) {
                // Ignore 401 on login and checkAuth to avoid infinite loop or false positives

                const url = error.config.url || "";
                const isAuthCheck = url.includes('/me') || url.includes('/login');

                if (!isAuthCheck) {
                    // Always clear auth storage on 401
                    localStorage.removeItem('auth_token');

                    const pathname = window.location.pathname;
                    const method = error.config.method?.toUpperCase();

                    // Routes that definitely require authentication
                    const protectedRoutes = ['/admin', '/student', '/dashboard', '/settings', '/account', '/apply'];
                    const isProtectedPath = protectedRoutes.some(route => pathname.startsWith(route));

                    // Special case for members: /members/memberList is public, others are protected
                    const isProtectedMemberPath = pathname.startsWith('/members') && pathname !== '/members/memberList';

                    // Redirect ONLY if:
                    // 1. We are on a protected path
                    // 2. We are performing a mutation (POST, PUT, DELETE, PATCH)
                    // 3. We are not already on the login page
                    const isMutation = method !== 'GET';
                    const shouldRedirect = (isProtectedPath || isProtectedMemberPath || isMutation) && pathname !== '/login';

                    if (shouldRedirect) {
                        window.location.href = '/login';
                    }
                }
            }
            return Promise.reject(error);
        }
    );

    return api;
};
