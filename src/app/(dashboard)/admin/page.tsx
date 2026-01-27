'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Activity, 
  ArrowUpRight, 
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  ClipboardList
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    revenue: 0,
    activeDrivers: 0,
    pendingApplications: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    fetchData();

    // Real-time subscription for orders
    const channel = supabase
      .channel('admin-dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          fetchData(); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      // 1. Orders & Revenue
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          total_amount, 
          status, 
          created_at, 
          id, 
          customer_id, 
          restaurant_id, 
          users:customer_id(email), 
          restaurant_profiles:restaurant_id(restaurant_name)
        `)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching orders:', JSON.stringify(ordersError, null, 2));
      }

      const totalRevenue = ordersData?.reduce((acc, order) => acc + (order.total_amount || 0), 0) || 0;
      
      // 2. Users Count
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // 3. Active Drivers (Approved Drivers) - Using metadata or checking role + status
      // We don't have 'online' status yet, so counting 'approved' drivers for now as 'Fleet Size'
      const { count: approvedDrivers } = await supabase
        .from('users') // Ideally filter by role='driver' if possible, or join with driver_profiles if that existed. 
        // Current user model stores role in metadata or just assumes. 
        // But we have driver_applications table which links to user.
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved'); 
        // Note: This counts ALL approved users. To be precise we need role.
        // Assuming user_metadata contains role, but filtering by jsonb in supabase is tricky without setup.
        // Let's count 'driver_applications' with status 'approved' as a proxy for approved drivers.
      
      const { count: driverCount } = await supabase
        .from('driver_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      // 4. Pending Applications
      const { data: driverApps } = await supabase
        .from('driver_applications')
        .select('id, legal_name, created_at, status')
        .in('status', ['submitted', 'under_review'])
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: restApps } = await supabase
        .from('restaurant_applications')
        .select('id, restaurant_name, created_at, status')
        .in('status', ['submitted', 'under_review'])
        .order('created_at', { ascending: false })
        .limit(5);

      const allPending = [
        ...(driverApps?.map(d => ({ ...d, type: 'driver', name: d.legal_name })) || []),
        ...(restApps?.map(r => ({ ...r, type: 'restaurant', name: r.restaurant_name })) || [])
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setPendingApprovals(allPending.slice(0, 5));

      setStats({
        totalUsers: usersCount || 0,
        totalOrders: ordersData?.length || 0,
        revenue: totalRevenue,
        activeDrivers: driverCount || 0,
        pendingApplications: (driverApps?.length || 0) + (restApps?.length || 0) // Approximation of total pending (limited by query but good enough for now or need count query)
      });
      
      // Better count for pending
      const { count: pendingDrivers } = await supabase.from('driver_applications').select('*', { count: 'exact', head: true }).in('status', ['submitted', 'under_review']);
      const { count: pendingRests } = await supabase.from('restaurant_applications').select('*', { count: 'exact', head: true }).in('status', ['submitted', 'under_review']);
      
      setStats(prev => ({
          ...prev,
          pendingApplications: (pendingDrivers || 0) + (pendingRests || 0)
      }));

      setRecentOrders(ordersData?.slice(0, 5) || []);

    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'delivered': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border border-red-200';
      case 'pending': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'preparing': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'out_for_delivery': return 'bg-purple-100 text-purple-800 border border-purple-200';
      default: return 'bg-slate-100 text-slate-800 border border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-slate-50/50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Overview</h1>
          <p className="text-slate-500">Welcome back, Administrator</p>
        </div>
        <div className="flex space-x-3">
          <Link href="/admin/settings" className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 shadow-sm shadow-orange-200 transition-colors">
            Settings
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 transition hover:shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Revenue</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">{formatCurrency(stats.revenue)}</h3>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 transition hover:shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Orders</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">{stats.totalOrders}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <ShoppingBag className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 transition hover:shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Users</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">{stats.totalUsers}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 transition hover:shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Approved Drivers</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">{stats.activeDrivers}</h3>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm text-orange-600 font-medium hover:text-orange-700">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-100 rounded w-16 animate-pulse"></div></td>
                      <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-100 rounded w-24 animate-pulse"></div></td>
                      <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-100 rounded w-16 animate-pulse"></div></td>
                      <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-100 rounded w-20 animate-pulse"></div></td>
                      <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-100 rounded w-24 animate-pulse"></div></td>
                    </tr>
                  ))
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        #{order.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {order.users?.email || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full shadow-sm ${getStatusColor(order.status)}`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
                {!loading && recentOrders.length === 0 && (
                    <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                            No orders found.
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Approvals (Real Data) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-fit">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-900">Pending Approvals</h3>
                <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2 py-1 rounded-full">
                    {stats.pendingApplications}
                </span>
            </div>
            
            <div className="space-y-4">
              {pendingApprovals.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No pending applications.</p>
              ) : (
                pendingApprovals.map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group hover:bg-slate-100 transition-colors">
                    <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 font-bold shadow-sm">
                        {app.type === 'driver' ? 'D' : 'R'}
                        </div>
                        <div className="ml-3">
                        <p className="text-sm font-medium text-slate-900 truncate max-w-[120px]">{app.name}</p>
                        <p className="text-xs text-slate-500">{format(new Date(app.created_at), 'MMM d, h:mm a')}</p>
                        </div>
                    </div>
                    <Link 
                        href={`/admin/hr/${app.type}/${app.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium px-2 py-1"
                    >
                        Review
                    </Link>
                    </div>
                ))
              )}
            </div>
            <Link href="/admin/hr" className="block w-full mt-4 text-center text-sm text-orange-600 font-medium hover:text-orange-700 py-2 rounded-lg hover:bg-orange-50 transition-colors">
              View All Applications
            </Link>
        </div>
      </div>
    </div>
  );
}
