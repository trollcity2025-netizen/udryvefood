'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import DriverMap from '@/components/maps';
import { Switch } from '@headlessui/react';
import { MapPin, Navigation, Package, CheckCircle, DollarSign, Clock, Search, MessageSquare, ChevronRight, AlertTriangle, Lock } from 'lucide-react';
import ChatWindow from '@/components/chat/ChatWindow';
import Link from 'next/link';
import { differenceInHours } from 'date-fns';

interface Order {
  id: string;
  total_amount: number;
  delivery_address: string;
  delivery_lat: number;
  delivery_lng: number;
  restaurant_id: string;
  user_id: string;
  customer_id: string;
  status: string;
  created_at: string;
  restaurant_profiles: {
    restaurant_name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  users: {
      email: string;
  }
}

export default function DriverDashboard() {
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    todayEarnings: 0,
    weekEarnings: 0,
    completedToday: 0,
    todayTips: 0,
    todayMiles: 0
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [accountStatus, setAccountStatus] = useState<'active' | 'restricted' | 'warning'>('active');
  const [restrictionReason, setRestrictionReason] = useState('');
  const supabase = createClient();

  useEffect(() => {
    // Get initial location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      });
      
      const watchId = navigator.geolocation.watchPosition((position) => {
          setLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
          });
          updateLocation(position.coords.latitude, position.coords.longitude);
      });
      
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const updateLocation = async (lat: number, lng: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        await supabase.from('driver_profiles').update({
            current_lat: lat,
            current_lng: lng,
            last_updated: new Date().toISOString(),
            is_online: true
        }).eq('user_id', user.id);
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('driver_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUser(user);

    // Fetch active orders (assigned to me)
    const { data: orders } = await supabase
      .from('orders')
      .select(`
        *,
        restaurant_profiles:restaurant_id (restaurant_name, address, latitude, longitude),
        users:customer_id (email)
      `)
      .eq('driver_id', user.id)
      .in('status', ['preparing', 'ready', 'out_for_delivery'])
      .order('created_at', { ascending: false });

    if (orders) {
        setActiveOrders(orders as any[]);
    }

    // Fetch earnings stats
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const { data: deliveredOrders } = await supabase
        .from('orders')
        .select('total_amount, created_at, tips, delivery_distance_miles')
        .eq('driver_id', user.id)
        .eq('status', 'delivered')
        .gte('created_at', startOfWeek.toISOString());

    if (deliveredOrders) {
        const todayOrders = deliveredOrders.filter(o => new Date(o.created_at) >= today);
        const todaySum = todayOrders.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
        const weekSum = deliveredOrders.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
        
        const todayTips = todayOrders.reduce((acc, curr) => acc + (curr.tips || 0), 0);
        const todayMiles = todayOrders.reduce((acc, curr) => acc + (curr.delivery_distance_miles || 0), 0);

        // Assuming 20% commission for driver for now
        setStats({
            todayEarnings: todaySum * 0.20,
            weekEarnings: weekSum * 0.20,
            completedToday: todayOrders.length,
            todayTips,
            todayMiles
        });
    }

    setLoading(false);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
      await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      fetchData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-[#F5F6FA] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Driver Dashboard</h1>
          <p className="text-slate-500 mt-1">Good afternoon, {user?.user_metadata?.fullName || 'Alex'}! Here's a summary of your current activity.</p>
        </div>
        
        <div className="flex items-center bg-white rounded-lg shadow-sm border border-slate-200 p-2">
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-colors ${isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'}`}>
                <div className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                <span className="text-sm font-medium">{isOnline ? 'Status: Online' : 'Status: Offline'}</span>
            </div>
            <Switch
                checked={isOnline}
                onChange={(checked) => {
                  if (accountStatus === 'restricted') {
                    alert('You cannot go online while your account is restricted.');
                    return;
                  }
                  setIsOnline(checked);
                }}
                disabled={accountStatus === 'restricted'}
                className={`${isOnline ? 'bg-emerald-500' : accountStatus === 'restricted' ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-200'} ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2`}
            >
                <span className={`${isOnline ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`} />
            </Switch>
        </div>
      </div>

      {/* Account Status Alerts */}
      {accountStatus === 'restricted' && (
        <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-4">
          <div className="p-2 bg-red-100 rounded-lg text-red-600">
            <Lock size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-red-900 mb-1">Account Restricted</h3>
            <p className="text-red-700 mb-4">
              Your driver account has been restricted because your insurance document has expired for more than 48 hours. 
              You cannot go online or accept new orders until you upload a valid insurance document.
            </p>
            <Link 
              href="/driver/documents" 
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Update Insurance Now
            </Link>
          </div>
        </div>
      )}

      {accountStatus === 'warning' && (
        <div className="mb-8 bg-orange-50 border border-orange-200 rounded-xl p-6 flex items-start gap-4">
          <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-orange-900 mb-1">Insurance Expiry Warning</h3>
            <p className="text-orange-700 mb-4">
              {restrictionReason || 'Your insurance has expired.'} Your account will be restricted soon if you do not update your documents.
            </p>
            <Link 
              href="/driver/documents" 
              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
            >
              Update Documents
            </Link>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Earnings Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between h-40 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex justify-between items-start z-10">
                <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Today's Earnings</h3>
                    <div className="text-3xl font-bold text-slate-900">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.todayEarnings)}
                    </div>
                </div>
                <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                    <DollarSign size={20} />
                </div>
            </div>
        </div>

        {/* Active Orders Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between h-40 relative overflow-hidden group hover:shadow-md transition-all">
             <div className="flex justify-between items-start z-10">
                 <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Active Orders</h3>
                    <div className="text-3xl font-bold text-slate-900">{activeOrders.length}</div>
                </div>
                <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                    <Package size={20} />
                </div>
            </div>
            <div className="flex items-center justify-between mt-4 z-10">
                 <div className="flex items-center space-x-3 text-sm text-slate-500">
                    <span className="flex items-center text-xs">View details below</span>
                 </div>
            </div>
        </div>

        {/* Online Status Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between h-40 relative overflow-hidden group hover:shadow-md transition-all">
             <div className="flex items-start justify-between z-10">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center">
                        <CheckCircle size={20} className="text-emerald-500 mr-2" /> Online
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Accepting new deliveries</p>
                </div>
                 <Switch
                    checked={isOnline}
                    onChange={setIsOnline}
                    className={`${isOnline ? 'bg-emerald-500' : 'bg-slate-200'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                >
                    <span className={`${isOnline ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`} />
                </Switch>
            </div>
            <div className="flex items-center justify-between mt-4 text-sm text-slate-500 z-10 w-full border-t border-slate-50 pt-3">
                <span>Status: <span className="font-medium text-slate-700">{isOnline ? 'Active' : 'Inactive'}</span></span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area (Active Deliveries) */}
        <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Active Deliveries</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        className="pl-9 pr-4 py-2 border border-slate-200 rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent w-64 text-slate-700 placeholder-slate-400 shadow-sm"
                    />
                </div>
            </div>

            {/* Order Cards */}
            <div className="space-y-4">
                {activeOrders.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-slate-200">
                        <div className="mx-auto h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-4">
                            <Package size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">No active deliveries</h3>
                        <p className="text-slate-500 mt-1">Wait for new orders to appear here.</p>
                    </div>
                ) : (
                    activeOrders.map((order) => (
                        <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition hover:shadow-md">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center space-x-4">
                                    <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center font-bold text-slate-600 text-lg border border-slate-200">
                                        {order.restaurant_profiles?.restaurant_name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">{order.restaurant_profiles?.restaurant_name}</h3>
                                        <div className="flex items-center text-sm text-slate-500 mt-0.5">
                                            <MessageSquare size={14} className="mr-1" />
                                            <span>Order #{order.id.slice(0, 8)}</span>
                                        </div>
                                    </div>
                                </div>
                                <span className="text-sm font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                                    {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>

                            <div className="space-y-4 mb-6 relative">
                                <div className="absolute left-[9px] top-2 bottom-6 w-0.5 bg-slate-200 -z-0"></div>
                                <div className="flex items-start relative z-10">
                                    <div className="h-5 w-5 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center mr-3 mt-0.5 shadow-sm">
                                        <div className="h-2 w-2 rounded-full bg-slate-400"></div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">Pickup: {order.restaurant_profiles?.address}</p>
                                    </div>
                                </div>
                                <div className="flex items-start relative z-10">
                                    <div className="h-5 w-5 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center mr-3 mt-0.5 shadow-sm">
                                        <MapPin className="h-3 w-3 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">Dropoff: {order.delivery_address}</p>
                                        <p className="text-xs text-slate-500 mt-1">Customer: {order.users?.email}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex space-x-3 pt-4 border-t border-slate-50">
                                <button className="flex-1 bg-white border border-slate-200 text-slate-700 font-medium py-2.5 rounded-lg hover:bg-slate-50 transition text-sm shadow-sm">
                                    Pickup Details
                                </button>
                                <button className="flex-1 bg-white border border-slate-200 text-slate-700 font-medium py-2.5 rounded-lg hover:bg-slate-50 transition text-sm flex items-center justify-center shadow-sm">
                                    <Navigation size={16} className="mr-2 text-blue-500" />
                                    View Map
                                </button>
                                {order.status === 'ready' && (
                                    <button 
                                        onClick={() => handleStatusUpdate(order.id, 'out_for_delivery')}
                                        className="flex-1 bg-orange-600 text-white font-medium py-2.5 rounded-lg hover:bg-orange-700 transition text-sm shadow-sm shadow-orange-200"
                                    >
                                        Start Delivery
                                    </button>
                                )}
                                {order.status === 'out_for_delivery' && (
                                    <button 
                                        onClick={() => handleStatusUpdate(order.id, 'delivered')}
                                        className="flex-1 bg-emerald-600 text-white font-medium py-2.5 rounded-lg hover:bg-emerald-700 transition text-sm shadow-sm shadow-emerald-200"
                                    >
                                        Complete
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            {/* Live Map Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-900">Live Map</h3>
                    <span className="text-xs text-emerald-600 font-medium flex items-center">
                        <span className="relative flex h-2 w-2 mr-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Updating live
                    </span>
                </div>
                <div className="h-[300px] w-full bg-slate-100">
                    <DriverMap driverLat={location?.lat || 40.7128} driverLng={location?.lng || -74.0060} />
                </div>
            </div>
        </div>

        {/* Right Sidebar (Earnings & Messages) */}
        <div className="space-y-6">
             {/* Earnings Overview */}
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-900">Earnings Overview</h3>
                </div>
                
                <div className="mb-6">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-sm text-slate-500">Today's earnings:</span>
                        <span className="text-xl font-bold text-slate-900">${stats.todayEarnings.toFixed(2)}</span>
                    </div>
                    {/* Weekly Chart Placeholder */}
                    <div className="h-32 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                        <p className="text-xs text-slate-400">Weekly chart will appear after more data is collected</p>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-200">
                    <div className="flex justify-between mb-4">
                        <div>
                            <p className="text-sm text-slate-500">This Week's Earnings</p>
                            <p className="text-2xl font-bold text-slate-900">${stats.weekEarnings.toFixed(2)}</p>
                        </div>
                    </div>
                    <button className="w-full bg-orange-600 text-white font-medium py-3 rounded-lg hover:bg-orange-700 transition shadow-sm hover:shadow shadow-orange-200">
                        Cash Out
                    </button>
                </div>
             </div>

             {/* Daily Summary */}
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-900">Daily Summary</h3>
                    <ChevronRight className="text-slate-400 h-4 w-4" />
                </div>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-600">Miles</span>
                        <span className="font-bold text-slate-900">{stats.todayMiles.toFixed(1)} mi</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-600">Deliveries completed</span>
                        <span className="font-bold text-slate-900">{stats.completedToday}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-600">Tips earned</span>
                        <span className="font-bold text-slate-900">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.todayTips)}
                        </span>
                    </div>
                </div>
             </div>

             {/* Recent Messages */}
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-900">Recent Messages</h3>
                </div>
                {activeOrders.length > 0 && activeOrders[0]?.customer_id ? (
                    <ChatWindow currentUserId={user?.id} otherUserId={activeOrders[0].customer_id} />
                ) : (
                    <div className="text-center text-slate-500 py-8">
                        <MessageSquare className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                        <p>No active chats</p>
                    </div>
                )}
             </div>
        </div>
      </div>
    </div>
  );
}