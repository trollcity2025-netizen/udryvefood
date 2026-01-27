'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { Search, Filter, Clock, CheckCircle, XCircle, ChevronDown, List } from 'lucide-react';

interface OrderItem {
    quantity: number;
    price_at_time: number;
    menu_items: {
        name: string;
    };
}

interface Order {
    id: string;
    status: string;
    created_at: string;
    total_amount: number;
    delivery_address: string;
    users: {
        email: string;
    };
    order_items: OrderItem[];
}

export default function RestaurantOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const supabase = createClient();

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('restaurant_orders_page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, filterStatus, searchQuery]);

  const fetchOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('orders')
      .select(`
          *,
          users:customer_id (email),
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
        setOrders(data as any[]);
    }
    setLoading(false);
  };

  const filterOrders = () => {
    let result = orders;

    // Status Filter
    if (filterStatus !== 'all') {
        result = result.filter(order => order.status === filterStatus);
    }

    // Search Filter
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        result = result.filter(order => 
            order.id.toLowerCase().includes(query) ||
            order.users?.email.toLowerCase().includes(query)
        );
    }

    setFilteredOrders(result);
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    fetchOrders(); 
  };

  const getStatusColor = (status: string) => {
      switch(status) {
        case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
        case 'preparing': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
        case 'ready': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'delivered': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-slate-100 text-slate-800 border-slate-200';
      }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading orders...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-900">Orders</h1>
            <p className="text-slate-500 mt-2">Manage and track all your restaurant orders.</p>
        </div>
        <div className="flex items-center space-x-4">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input 
                    type="text" 
                    placeholder="Search by ID or email..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-64 shadow-sm"
                />
            </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-slate-100 flex overflow-x-auto">
            {['all', 'pending', 'preparing', 'ready', 'delivered', 'cancelled'].map((status) => (
                <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                        filterStatus === status 
                        ? 'border-orange-500 text-orange-600' 
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
            ))}
        </div>

        {/* List */}
        <div className="divide-y divide-slate-100">
            {filteredOrders.length === 0 ? (
                <div className="p-12 text-center">
                    <div className="mx-auto h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-4">
                        <List size={24} />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">No orders found</h3>
                    <p className="text-slate-500 mt-1">Try adjusting your filters or search query.</p>
                </div>
            ) : (
                filteredOrders.map((order) => (
                    <div key={order.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                    <h3 className="text-lg font-bold text-slate-900">Order #{order.id.slice(0, 8)}</h3>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </div>
                                <div className="flex items-center text-sm text-slate-500 mb-4">
                                    <Clock size={14} className="mr-1.5" />
                                    {new Date(order.created_at).toLocaleString()}
                                    <span className="mx-2">•</span>
                                    <span className="font-medium text-slate-900">{order.users?.email}</span>
                                </div>
                                
                                <div className="space-y-2 mb-4">
                                    {order.order_items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span className="text-slate-700">
                                                <span className="font-bold mr-2">{item.quantity}x</span>
                                                {item.menu_items.name}
                                            </span>
                                            <span className="text-slate-500">${item.price_at_time}</span>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="text-sm text-slate-500">
                                    <span className="font-medium text-slate-700">Delivery Address:</span> {order.delivery_address}
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-4 min-w-[200px]">
                                <div className="text-xl font-bold text-slate-900">
                                    ${order.total_amount}
                                </div>
                                
                                <div className="flex flex-col w-full gap-2">
                                    {order.status === 'pending' && (
                                        <>
                                            <button 
                                                onClick={() => updateStatus(order.id, 'preparing')}
                                                className="w-full bg-orange-600 text-white font-medium py-2 rounded-lg hover:bg-orange-700 transition text-sm shadow-sm"
                                            >
                                                Accept Order
                                            </button>
                                            <button 
                                                onClick={() => updateStatus(order.id, 'cancelled')}
                                                className="w-full bg-white border border-slate-200 text-red-600 font-medium py-2 rounded-lg hover:bg-red-50 transition text-sm"
                                            >
                                                Decline
                                            </button>
                                        </>
                                    )}
                                    {order.status === 'preparing' && (
                                        <button 
                                            onClick={() => updateStatus(order.id, 'ready')}
                                            className="w-full bg-emerald-600 text-white font-medium py-2 rounded-lg hover:bg-emerald-700 transition text-sm shadow-sm"
                                        >
                                            Mark Ready
                                        </button>
                                    )}
                                    {order.status === 'ready' && (
                                        <div className="text-center text-sm text-slate-500 italic py-2">
                                            Waiting for driver...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
}
