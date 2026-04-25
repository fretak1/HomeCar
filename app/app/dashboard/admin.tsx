import DashboardScreen from '../../src/screens/DashboardScreen';

export default function AdminDashboardRoute() {
  return <DashboardScreen forcedRole="ADMIN" />;
}
