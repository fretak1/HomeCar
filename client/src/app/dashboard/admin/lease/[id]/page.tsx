"use client";

import { useParams } from 'next/navigation';
import LeaseDetailView from '@/components/dashboard/LeaseDetailView';

export default function AdminLeaseDetailsPage() {
    const params = useParams();
    const id = params?.id as string;
    
    return <LeaseDetailView id={id} role="admin" />;
}
