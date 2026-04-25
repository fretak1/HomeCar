import { UserRole } from '../types/user';

export const getDashboardRoute = (role?: UserRole | string | null) => {
  const normalizedRole = (role ?? '').toString().toUpperCase();
  
  if (normalizedRole === 'CUSTOMER') {
    return '/';
  }

  // Use the explicit tab route to avoid conflicts with the top-level /dashboard directory
  // and ensure the bottom navigation bar remains visible.
  return '/(tabs)/dashboard';
};
