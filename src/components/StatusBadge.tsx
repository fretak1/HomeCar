import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: 'available' | 'booked' | 'sold' | 'active' | 'pending' | 'completed' | 'cancelled' | 'resolved' | 'in-progress';
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'available':
      case 'active':
      case 'completed':
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'booked':
      case 'pending':
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'sold':
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Badge className={`${getStatusStyles()} border ${className}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
