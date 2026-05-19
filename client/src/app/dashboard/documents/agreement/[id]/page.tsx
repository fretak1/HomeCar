"use client";

import { useParams } from 'next/navigation';
import AgreementDetail from '@/components/documents/AgreementDetail';

export default function AgreementPage() {
    const params = useParams();
    const id = params?.id as string;
    
    return <AgreementDetail id={id} role="customer" />;
}
