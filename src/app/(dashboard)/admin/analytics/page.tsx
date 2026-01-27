'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Store, 
  TrendingUp, 
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export default function AdminAnalytics() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRestaurants: 0
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Parallel data fetching
      const [
        { data: orders },
        { count: userCount },
        { count: restaurantCount }
      ] = await Promise.all([
        supabase.from('orders').select('total_amount, created_at, status'),
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('restaurant_profiles').select('*', { count: 'exact', head: true })
      ]);

      if (orders) {
        // Calculate total revenue (from completed orders preferably, but for now all non-cancelled)
        const validOrders = orders.filter(o => o.status !== 'cancelled');
        const revenue = validOrders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
        
        // Prepare chart data (group by date)
        const dailyRevenue = validOrders.reduce((acc: any, order) => {
          const date = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          acc[date] = (acc[date] || 0) + (Number(order.total_amount) || 0);
          return acc;
        }, {});

        const chartData = Object.keys(dailyRevenue).map(date => ({
          name: date,
          revenue: dailyRevenue[date]
        })).slice(-7); // Last 7 days

        setRevenueData(chartData);
        setStats({
          totalRevenue: revenue,
          totalOrders: orders.length,
          totalUsers: userCount || 0,
          totalRestaurants: restaurantCount || 0
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, prefix = '' }: any) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
          <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        <span className="flex items-center text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
          <TrendingUp className="h-3 w-3 mr-1" />
          +12.5%
        </span>
      </div>
      <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-slate-900 mt-1">
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
        <div className="flex space-x-2">
           <select className="border-slate-200 rounded-lg text-sm focus:ring-orange-500 focus:border-orange-500">
             <option>Last 7 Days</option>
             <option>Last 30 Days</option>
             <option>This Year</option>
           </select>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Revenue" 
          value={stats.totalRevenue} 
          prefix="$" 
          icon={DollarSign} 
          color="bg-emerald-500" 
        />
        <StatCard 
          title="Total Orders" 
          value={stats.totalOrders} 
          icon={ShoppingBag} 
          color="bg-orange-500" 
        />
        <StatCard 
          title="Total Users" 
          value={stats.totalUsers} 
          icon={Users} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Restaurants" 
          value={stats.totalRestaurants} 
          icon={Store} 
          color="bg-purple-500" 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Revenue Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#f97316" 
                  radius={[4, 4, 0, 0]} 
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity / Secondary Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
           <h3 className="text-lg font-bold text-slate-900 mb-6">Growth Overview</h3>
           <div className="h-80 flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <p>User Growth Chart Coming Soon</p>
           </div>
        </div>
      </div>
    </div>
  );
}
