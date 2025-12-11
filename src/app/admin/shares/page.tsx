
"use client";

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import AuthenticatedRoute from '@/components/AuthenticatedRoute';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

export default function AdminSharesPage() {
    const [items, setItems] = useState<any[]>([]);
    const [status, setStatus] = useState('PENDING');

    const fetchItems = async () => {
        const res = await fetch(`/api/admin/pendingShares?status=${status}`);
        const data = await res.json();
        setItems(data.items || []);
    };

    useEffect(() => {
        fetchItems();
    }, [status]);

    const handleAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
        const res = await fetch('/api/admin/pendingShares', {
            method: 'POST',
            body: JSON.stringify({ id, action })
        });
        if (res.ok) {
            toast.success(`${action} successful`);
            fetchItems();
        } else {
            toast.error("Failed");
        }
    };

    return (
        <AuthenticatedRoute>
            <AppLayout>
                <div className="p-4 max-w-4xl mx-auto pb-20">
                    <h1 className="text-2xl font-bold text-white mb-4">Pending Shares Admin</h1>

                    <div className="flex gap-2 mb-4">
                        {['PENDING', 'APPROVED', 'MINTED', 'REJECTED'].map(s => (
                            <Button
                                key={s}
                                variant={status === s ? 'default' : 'secondary'}
                                onClick={() => setStatus(s)}
                            >
                                {s}
                            </Button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        {items.map(item => (
                            <Card key={item.id} className="bg-zinc-900 border-zinc-700">
                                <CardContent className="p-4 flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-white">{item.amount} Shares</div>
                                        <div className="text-sm text-zinc-400">User: {item.user.walletAddress}</div>
                                        <div className="text-xs text-zinc-500">Reason: {item.reason}</div>
                                        <div className="text-xs text-zinc-600 font-mono">{new Date(item.createdAt).toLocaleString()}</div>
                                    </div>
                                    {status === 'PENDING' && (
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="destructive" onClick={() => handleAction(item.id, 'REJECT')}>Reject</Button>
                                            <Button size="sm" className="bg-green-600 hover:bg-green-500" onClick={() => handleAction(item.id, 'APPROVE')}>Approve</Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                        {items.length === 0 && <div className="text-zinc-500">No items found.</div>}
                    </div>
                </div>
            </AppLayout>
        </AuthenticatedRoute>
    );
}
