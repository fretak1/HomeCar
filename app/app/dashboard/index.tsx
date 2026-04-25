import { Redirect } from 'expo-router';

import { useAuthStore } from '../../src/store/useAuthStore';
import { getDashboardRoute } from '../../src/utils/routes';

export default function DashboardIndexRoute() {
  const { user, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return null;
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return <Redirect href={getDashboardRoute(user.role)} />;
}
