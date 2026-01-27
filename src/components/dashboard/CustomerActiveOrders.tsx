'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { Check, Clock, Truck, Home } from 'lucide-react';

interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  restaurant_profiles: {
    restaurant_name: string;
  };
}

export default function CustomerActiveOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('customer_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('orders')
      .select('*, restaurant_profiles(restaurant_name)')
      .eq('customer_id', user.id)
      .in('status', ['pending', 'preparing', 'ready_for_pickup', 'picked_up', 'in_transit'])
      .order('created_at', { ascending: false });

    setOrders(data as any || []);
    setLoading(false);
  };

  const getStepStatus = (currentStatus: string, step: string) => {
    const steps = ['pending', 'preparing', 'ready_for_pickup', 'in_transit', 'delivered'];
    const currentIndex = steps.indexOf(currentStatus === 'picked_up' ? 'in_transit' : currentStatus);
    const stepIndex = steps.indexOf(step);

    if (currentIndex > stepIndex) return 'completed';
    if (currentIndex === stepIndex) return 'current';
    return 'upcoming';
  };

  if (loading) return <div className="text-center py-4 text-slate-500">Loading orders...</div>;
  if (orders.length === 0) return (
    <div className="text-center py-10 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
        <p className="text-slate-500">No active orders</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {orders.map((order) => (
        <div key={order.id} className="bg-white rounded-lg p-6 border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-slate-900">{order.restaurant_profiles.restaurant_name}</h3>
                    <p className="text-sm text-slate-500">Order #{order.id.slice(0, 8)}</p>
                </div>
                <span className="font-bold text-slate-900">${order.total_amount.toFixed(2)}</span>
            </div>

            {/* Progress Tracker */}
            <div className="relative flex justify-between items-center mt-6">
                 {/* Progress Line */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -z-10 transform -translate-y-1/2" />
                
                {/* Steps */}
                {[
                    { id: 'pending', label: 'Placed', icon: Clock },
                    { id: 'preparing', label: 'Preparing', icon: Check },
                    { id: 'ready_for_pickup', label: 'Ready', icon: Home },
                    { id: 'in_transit', label: 'On Way', icon: Truck },
                ].map((step, idx) => {
                    const status = getStepStatus(order.status, step.id);
                    const isCompleted = status === 'completed';
                    const isCurrent = status === 'current';
                    
                    return (
                        <div key={step.id} className="flex flex-col items-center bg-white px-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                                isCompleted || isCurrent 
                                    ? 'bg-orange-600 border-orange-600 text-white' 
                                    : 'bg-white border-slate-200 text-slate-300'
                            }`}>
                                <step.icon size={14} />
                            </div>
                            <span className={`text-xs mt-1 font-medium ${
                                isCurrent ? 'text-orange-600' : 'text-slate-400'
                            }`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
            
            <div className="mt-4 text-center">
                 <p className="text-sm font-medium text-slate-900">
                    {order.status === 'pending' && 'Waiting for restaurant confirmation...'}
                    {order.status === 'preparing' && 'Restaurant is preparing your food.'}
                    {order.status === 'ready_for_pickup' && 'Your order is ready for pickup.'}
                    {(order.status === 'picked_up' || order.status === 'in_transit') && 'Driver is on the way!'}
                 </p>
            </div>
        </div>
      ))}
    </div>
  );
}
