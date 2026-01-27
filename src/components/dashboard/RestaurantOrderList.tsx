'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, Truck } from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  price_at_time: number;
  menu_item_name?: string; // We might need to join menu_items to get the name if not stored directly
  // Actually, checking the schema, we didn't store name in order_items, only menu_item_id.
  // We should fetch menu_items(name) via join.
  menu_items: {
      name: string;
  };
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  delivery_address: string;
  customer_id: string;
  order_items: OrderItem[];
}

export default function RestaurantOrderList({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to new orders
    const channel = supabase
      .channel('restaurant_orders')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE)
          schema: 'public',
          table: 'orders',
          // We can't easily filter by restaurant_id in the subscription filter string securely without RLS policies
          // assuming RLS handles security, we just filter incoming events or refetch
        },
        async (payload) => {
           // Simplest approach: Refetch all active orders on any change to ensure we have the latest joined data
           // Optimization: Check if payload.new.restaurant_id matches current user (but we don't have user id here easily without context)
           // Let's just refetch.
           fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          quantity,
          price_at_time,
          menu_items (
            name
          )
        )
      `)
      .eq('restaurant_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
        // Transform data to match Order interface if needed
        // The query returns menu_items as an object inside order_items because of the join
        setOrders(data as any);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      alert('Error updating order: ' + error.message);
    } else {
        // Optimistic update
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-sky-50 text-sky-700 border border-sky-200';
      case 'preparing': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'ready_for_pickup': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'picked_up': return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'in_transit': return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
      case 'delivered': return 'bg-slate-100 text-slate-600 border border-slate-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border border-red-200';
      default: return 'bg-slate-100 text-slate-600 border border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {orders.length === 0 ? (
         <div className="text-center py-10 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-slate-500">No active orders found.</p>
         </div>
      ) : (
        orders.map((order) => (
            <div key={order.id} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)} uppercase tracking-wide`}>
                            {order.status.replace(/_/g, ' ')}
                        </span>
                        <span className="ml-3 text-sm text-slate-500">
                            #{order.id.slice(0, 8)} • {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <div className="font-bold text-slate-900 text-lg">${order.total_amount.toFixed(2)}</div>
                </div>
                
                <div className="p-6">
                    <div className="mb-4">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Items</h4>
                        <ul className="space-y-3">
                            {order.order_items.map((item: any, idx: number) => (
                                <li key={idx} className="flex justify-between text-sm text-slate-600 border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                                    <div className="flex flex-col">
                                        <span className="flex items-center">
                                            <span className="font-bold text-slate-900 mr-2 w-6">{item.quantity}x</span> 
                                            {item.menu_items?.name || 'Unknown Item'}
                                        </span>
                                        {item.notes && (
                                            <span className="text-xs text-orange-600 italic mt-1 ml-8">
                                                Note: {item.notes}
                                            </span>
                                        )}
                                    </div>
                                    <span className="font-medium text-slate-700">${(item.price_at_time * item.quantity).toFixed(2)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    
                    <div className="mb-6 bg-slate-50 p-3 rounded-md border border-slate-100">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Delivery To</h4>
                        <p className="text-sm text-slate-700 font-medium">{order.delivery_address}</p>
                    </div>

                    <div className="flex space-x-3 pt-4 border-t border-slate-100">
                        {order.status === 'pending' && (
                            <>
                                <button 
                                    onClick={() => updateStatus(order.id, 'preparing')}
                                    className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition shadow-sm hover:shadow flex items-center justify-center space-x-2 font-medium"
                                >
                                    <CheckCircle size={18} />
                                    <span>Accept Order</span>
                                </button>
                                <button 
                                    onClick={() => updateStatus(order.id, 'cancelled')}
                                    className="flex-1 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition shadow-sm flex items-center justify-center space-x-2 font-medium"
                                >
                                    <XCircle size={18} />
                                    <span>Reject</span>
                                </button>
                            </>
                        )}

                        {order.status === 'preparing' && (
                            <button 
                                onClick={() => updateStatus(order.id, 'ready_for_pickup')}
                                className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition shadow-sm hover:shadow flex items-center justify-center space-x-2 font-medium"
                            >
                                <Clock size={18} />
                                <span>Mark Ready for Pickup</span>
                            </button>
                        )}

                        {order.status === 'ready_for_pickup' && (
                             <div className="flex-1 bg-slate-100 text-slate-500 px-4 py-2 rounded-lg flex items-center justify-center space-x-2 cursor-default border border-slate-200 font-medium">
                                <Truck size={18} />
                                <span>Waiting for Driver...</span>
                            </div>
                        )}
                         {(order.status === 'picked_up' || order.status === 'in_transit') && (
                             <div className="flex-1 bg-slate-100 text-slate-500 px-4 py-2 rounded-lg flex items-center justify-center space-x-2 cursor-default border border-slate-200 font-medium">
                                <Truck size={18} />
                                <span>Order Picked Up</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        ))
      )}
    </div>
  );
}
