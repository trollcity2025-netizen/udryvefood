'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { MapPin, Clock, DollarSign, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AvailableOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [accountFrozen, setAccountFrozen] = useState(false);
  const [freezeReason, setFreezeReason] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchOrders();

    // Real-time updates for new orders
    const channel = supabase
      .channel('available_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('driver_profiles')
          .select('account_frozen, freeze_reason')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          setAccountFrozen(!!profile.account_frozen);
          setFreezeReason(profile.freeze_reason || null);
        }
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          restaurant_profiles:restaurant_id (restaurant_name, address),
          users:customer_id (email)
        `)
        .is('driver_id', null)
        .in('status', ['preparing', 'ready'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const acceptOrder = async (orderId: string) => {
    if (accountFrozen) {
      alert('Your account is currently frozen. Please contact support.');
      return;
    }
    setProcessingId(orderId);
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('orders')
        .update({
          driver_id: user.id
        })
        .eq('id', orderId);

      if (error) throw error;

      fetchOrders();
      router.push('/driver/orders/assigned');
    } catch (err: any) {
      alert(`Error accepting order: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading orders...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Available Orders</h1>
          <p className="text-slate-500">Accept orders to start earning.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 text-sm font-medium">
          {orders.length} orders available
        </div>
      </div>

      {accountFrozen && (
        <div className="mb-6 bg-red-50 border border-red-100 rounded-lg p-4 text-sm text-red-800">
          Your driver account is currently frozen. You cannot accept new deliveries.
          {freezeReason && <span className="block mt-1 text-red-700">Reason: {freezeReason}</span>}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-slate-200">
            <div className="mx-auto h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-4">
                <Package size={32} />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No orders available</h3>
            <p className="text-slate-500 mt-1">Check back later for new deliveries.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{order.restaurant_profiles?.restaurant_name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1
                        ${order.status === 'ready' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                        {order.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-lg font-bold text-emerald-600">
                        ${((order.total_amount || 0) * 0.20).toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-500">Est. Earning</span>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                    <div className="flex items-start">
                        <MapPin className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-slate-900">Pickup</p>
                            <p className="text-sm text-slate-500">{order.restaurant_profiles?.address}</p>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <MapPin className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-slate-900">Dropoff</p>
                            <p className="text-sm text-slate-500">{order.delivery_address}</p>
                        </div>
                    </div>
                     <div className="flex items-center text-sm text-slate-500 bg-slate-50 p-3 rounded-lg">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>Order placed {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                </div>

                <button
                  onClick={() => acceptOrder(order.id)}
                  disabled={processingId === order.id}
                  className="w-full bg-emerald-600 text-white font-medium py-2.5 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 flex justify-center items-center"
                >
                  {processingId === order.id ? 'Accepting...' : 'Accept Order'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
