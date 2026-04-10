"use client";

import { use } from 'react';
import ReceiptDetail from '@/components/documents/ReceiptDetail';

export default function OwnerReceiptPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return <ReceiptDetail id={id} role="owner" />;
}
