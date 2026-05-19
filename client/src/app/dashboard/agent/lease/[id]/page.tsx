"use client";

import { use } from 'react';
import LeaseDetailView from '@/components/dashboard/LeaseDetailView';

export default function AgentLeaseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    
    return <LeaseDetailView id={id} role="agent" />;
}
