"use client";

import { useParams } from 'next/navigation';
import ReceiptDetail from '@/components/documents/ReceiptDetail';

export default function CustomerReceiptPage() {
    const params = useParams();
    const id = params?.id as string;
    return <ReceiptDetail id={id} role="customer" />;
}
