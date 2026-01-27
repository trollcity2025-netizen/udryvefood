'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { DollarSign, Calendar, TrendingUp } from 'lucide-react';

export default function PayoutsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    pendingPayout: 0,
    paidOut: 0
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', user.id)
      .eq('status', 'delivered')
      .order('created_at', { ascending: false });

    if (data) {
        setOrders(data);
        const total = data.reduce((acc, order) => acc + order.total_amount, 0);
        setStats({
            totalEarnings: total,
            pendingPayout: total, // Assuming no payout system yet, all is pending
            paidOut: 0
        });
    }
    setLoading(false);
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading payouts...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Payouts</h1>
        <p className="text-slate-500 mt-2">Track your earnings and payment history.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-slate-500">Total Earnings</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">${stats.totalEarnings.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                    <TrendingUp size={24} />
                </div>
            </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-slate-500">Pending Payout</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">${stats.pendingPayout.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                    <DollarSign size={24} />
                </div>
            </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-slate-500">Last Payout</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">$0.00</p>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                    <Calendar size={24} />
                </div>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-semibold text-slate-900">Transaction History</h3>
        </div>
        <div className="divide-y divide-slate-100">
            {orders.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No transactions yet.</div>
            ) : (
                orders.map((order) => (
                    <div key={order.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div>
                            <p className="font-medium text-slate-900">Order #{order.id.slice(0, 8)}</p>
                            <p className="text-sm text-slate-500">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-emerald-600">+${order.total_amount.toFixed(2)}</p>
                            <p className="text-xs text-slate-500">Completed</p>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
}
