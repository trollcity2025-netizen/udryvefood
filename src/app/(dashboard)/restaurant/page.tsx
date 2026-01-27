'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, List, DollarSign, Search, Clock, CheckCircle, ChevronRight, TrendingUp, Star, MoreVertical } from 'lucide-react';
import { Switch } from '@headlessui/react';

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
    users: {
        email: string;
    };
    order_items: OrderItem[];
}

export default function RestaurantDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    todayEarnings: 0,
    weekEarnings: 0,
    todayOrdersCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('restaurant_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUser(user);

    const { data: ordersData } = await supabase
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
    
    if (ordersData) {
        setOrders(ordersData as any[]);
    }
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
      await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      fetchData(); // Optimistic update would be better, but this ensures consistency
  };

  const getStatusColor = (status: string) => {
      switch(status) {
        case 'pending': return 'bg-amber-100 text-amber-800 border border-amber-200';
        case 'preparing': return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
        case 'ready': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
          case 'delivered': return 'bg-blue-100 text-blue-800 border border-blue-200';
          default: return 'bg-slate-100 text-slate-800 border border-slate-200';
      }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-900">Restaurant Dashboard</h1>
            <p className="text-slate-500 mt-1">Hello, {user?.user_metadata?.restaurantName || 'Chef'}! Here's what's happening at your restaurant today.</p>
        </div>
        
        <div className="flex items-center bg-white rounded-lg shadow-sm border border-slate-200 p-2">
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-colors ${isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'}`}>
                <div className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                <span className="text-sm font-medium">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
             <Switch
                checked={isOnline}
                onChange={setIsOnline}
                className={`${isOnline ? 'bg-emerald-500' : 'bg-slate-200'} ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2`}
            >
                <span className={`${isOnline ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`} />
            </Switch>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="flex justify-between items-start z-10">
                        <div>
                            <h3 className="text-sm font-medium text-slate-500 mb-1">Today's Earnings</h3>
                            <div className="text-4xl font-bold text-slate-900">${stats.todayEarnings.toFixed(2)}</div>
                        </div>
                        <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                            <DollarSign size={24} />
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-6 z-10">
                         <span className="text-sm text-slate-500 font-medium flex items-center bg-slate-50 px-2 py-1 rounded-md">
                            {stats.todayOrdersCount} completed orders today
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="flex justify-between items-start z-10">
                        <div>
                            <h3 className="text-sm font-medium text-slate-500 mb-1">Open Orders</h3>
                            <div className="text-4xl font-bold text-slate-900">{orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length}</div>
                        </div>
                        <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                            <List size={24} />
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-6 z-10">
                        <div className="flex items-center text-sm text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                            <Clock size={16} className="mr-1" />
                            <span>Awaiting action</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Orders List */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">Active Orders</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <input 
                            type="text" 
                            placeholder="Search orders..." 
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-64 shadow-sm placeholder-slate-400 text-slate-700"
                        />
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex space-x-2 overflow-x-auto pb-2">
                    {['All Orders', 'Pending', 'Preparing', 'Ready'].map((tab, i) => (
                        <button key={tab} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shadow-sm ${i === 0 ? 'bg-slate-900 text-white ring-2 ring-slate-900 ring-offset-2' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-slate-300'}`}>
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Order List */}
                <div className="space-y-4">
                    {orders.length === 0 ? (
                        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm">
                            <div className="mx-auto h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-4">
                                <List size={32} />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900">No active orders</h3>
                            <p className="text-slate-500 mt-1">New orders will appear here instantly.</p>
                        </div>
                    ) : (
                        orders.map((order) => (
                            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition hover:shadow-md">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border border-slate-200">
                                            <span className="text-sm font-bold text-slate-600">#{order.id.slice(0,3)}</span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Order #{order.id.slice(0, 5)}</h3>
                                            <div className="flex items-center text-sm text-slate-500 mt-1">
                                                <span className="font-medium text-slate-700">{order.order_items.reduce((acc, item) => acc + item.quantity, 0)} items</span>
                                                <span className="mx-2 text-slate-300">•</span>
                                                <span>{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </div>

                                <div className="mb-6 pl-16 space-y-3">
                                    {order.order_items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm py-2 border-b border-slate-50 last:border-0">
                                            <span className="font-medium text-slate-900 flex items-center">
                                                <span className="h-6 w-6 rounded bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold mr-3">{item.quantity}</span>
                                                {item.menu_items.name}
                                            </span>
                                            <span className="text-slate-500 font-mono">${item.price_at_time}</span>
                                        </div>
                                    ))}
                                    <div className="mt-3 pt-2 text-sm text-slate-500 flex items-center">
                                        <div className="h-6 w-6 rounded-full bg-slate-100 mr-2 flex items-center justify-center text-slate-400">
                                            <span className="text-xs">U</span>
                                        </div>
                                        {order.users?.email}
                                    </div>
                                </div>

                                <div className="flex space-x-3 pl-16">
                                    {order.status === 'pending' && (
                                        <button 
                                            onClick={() => updateOrderStatus(order.id, 'preparing')}
                                            className="flex-1 bg-orange-600 text-white font-medium py-2.5 rounded-lg hover:bg-orange-700 transition text-sm shadow-sm shadow-orange-200"
                                        >
                                            Accept & Cook
                                        </button>
                                    )}
                                    {order.status === 'preparing' && (
                                        <button 
                                            onClick={() => updateOrderStatus(order.id, 'ready')}
                                            className="flex-1 bg-emerald-600 text-white font-medium py-2.5 rounded-lg hover:bg-emerald-700 transition text-sm shadow-sm shadow-emerald-200"
                                        >
                                            Mark Ready
                                        </button>
                                    )}
                                    <button className="flex-1 bg-white border border-slate-200 text-slate-700 font-medium py-2.5 rounded-lg hover:bg-slate-50 transition text-sm shadow-sm">
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
            {/* Analytics Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-900">Analytics</h3>
                    <div className="flex items-center text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                        <Clock size={12} className="mr-1" /> Today
                    </div>
                </div>
                
                <div className="mb-2">
                    <span className="text-sm text-slate-500">Today: </span>
                    <span className="font-bold text-slate-900">${stats.todayEarnings.toFixed(2)}</span>
                </div>
                <div className="mb-6">
                    <span className="text-sm text-slate-500">Week: </span>
                    <span className="text-xl font-bold text-slate-900">${stats.weekEarnings.toFixed(2)}</span>
                </div>

                {/* Chart Placeholder */}
                <div className="h-32 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                     <p className="text-xs text-slate-400">Chart will populate with more data</p>
                </div>
                
                <div className="mt-4 flex items-center text-xs text-slate-500 font-medium bg-slate-50 p-2 rounded-lg">
                    Real-time data
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}