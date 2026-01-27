'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Star, Home, Heart, Grid, LogOut, Settings, Package, List, DollarSign, MessageSquare, Clock, LayoutDashboard, UtensilsCrossed, Users, Store, BarChart3, MapPin, CreditCard, ClipboardCheck, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAdminView } from '@/context/AdminViewContext';

export default function Sidebar() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  const router = useRouter();
  const { viewRole, setViewRole } = useAdminView();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // Fetch all restaurants
      const { data: restData } = await supabase
        .from('restaurant_profiles')
        .select('user_id, restaurant_name, image_url');
      
      setRestaurants(restData || []);

      if (user) {
        // Fetch favorites
        const { data: favData } = await supabase
          .from('favorite_restaurants')
          .select('restaurant_id')
          .eq('user_id', user.id);
        
        if (favData) {
          setFavorites(new Set(favData.map(f => f.restaurant_id)));
        }
      }
    };

    fetchData();
  }, []);

  const toggleFavorite = async (restaurantId: string) => {
    if (!user) {
      alert('Please log in to manage favorites');
      return;
    }

    if (favorites.has(restaurantId)) {
      await supabase
        .from('favorite_restaurants')
        .delete()
        .eq('user_id', user.id)
        .eq('restaurant_id', restaurantId);
      
      const newFavs = new Set(favorites);
      newFavs.delete(restaurantId);
      setFavorites(newFavs);
    } else {
      await supabase
        .from('favorite_restaurants')
        .insert({ user_id: user.id, restaurant_id: restaurantId });
      
      const newFavs = new Set(favorites);
      newFavs.add(restaurantId);
      setFavorites(newFavs);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="h-screen w-64 bg-gradient-to-b from-slate-800 to-slate-900 border-r border-slate-700 fixed left-0 top-0 overflow-y-auto flex flex-col z-50 text-slate-300">
      <div className="p-6 border-b border-slate-700">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-3xl">🍔</span>
          <span className="text-xl font-bold text-white">UdryveFood</span>
        </Link>
      </div>

      <div className="flex-1 py-6 px-4 space-y-8">
        {/* Main Navigation */}
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Menu</h3>
          <nav className="space-y-1">
            {/* Driver Navigation */}
            {viewRole === 'driver' && (
              <>
                <Link href="/driver" className="flex items-center px-2 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-white/10 hover:text-white group transition-colors">
                  <LayoutDashboard className="mr-3 h-5 w-5 text-slate-400 group-hover:text-orange-500" />
                  Dashboard
                </Link>
                <Link href="/driver/orders/available" className="flex items-center px-2 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-white/10 hover:text-white group transition-colors">
                  <Package className="mr-3 h-5 w-5 text-slate-400 group-hover:text-orange-500" />
                  Available Orders
                </Link>
                 <Link href="/driver/orders/assigned" className="flex items-center px-2 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-white/10 hover:text-white group transition-colors">
                  <List className="mr-3 h-5 w-5 text-slate-400 group-hover:text-orange-500" />
                  Assigned Orders
                </Link>
                <Link href="/driver/history" className="flex items-center px-2 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-white/10 hover:text-white group transition-colors">
                  <Clock className="mr-3 h-5 w-5 text-slate-400 group-hover:text-orange-500" />
                  Order History
                </Link>
                <Link href="/driver/earnings" className="flex items-center px-2 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-white/10 hover:text-white group transition-colors">
                  <DollarSign className="mr-3 h-5 w-5 text-slate-400 group-hover:text-orange-500" />
                  Earnings
                </Link>
                <Link href="/driver/messages" className="flex items-center px-2 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-white/10 hover:text-white group transition-colors">
                  <MessageSquare className="mr-3 h-5 w-5 text-slate-400 group-hover:text-orange-500" />
                  Messages
                </Link>
                <Link href="/driver/documents" className="flex items-center px-2 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-white/10 hover:text-white group transition-colors">
                  <FileText className="mr-3 h-5 w-5 text-slate-400 group-hover:text-orange-500" />
                  Documents
                </Link>
                 <Link href="/driver/settings" className="flex items-center px-2 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-white/10 hover:text-white group transition-colors">
                  <Settings className="mr-3 h-5 w-5 text-slate-400 group-hover:text-orange-500" />
                  Settings
                </Link>
              </>
            )}

            {/* Restaurant Navigation */}
            {viewRole === 'restaurant' && (
               <>
                <Link href="/restaurant" className="flex items-center px-2 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-white/10 hover:text-white group transition-colors">
                  <LayoutDashboard className="mr-3 h-5 w-5 text-slate-400 group-hover:text-orange-500" />
                  Overview
                </Link>
                <Link href="/restaurant/menu" className="flex items-center px-2 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-white/10 hover:text-white group transition-colors">
                  <UtensilsCrossed className="mr-3 h-5 w-5 text-slate-400 group-hover:text-orange-500" />
                  Menu
                </Link>
                 <Link href="/restaurant/orders" className="flex items-center px-2 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-white/10 hover:text-white group transition-colors">
                  <List className="mr-3 h-5 w-5 text-slate-400 group-hover:text-orange-500" />
                  Orders
                </Link>
                <Link href="/restaurant/payouts" className="flex items-center px-2 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-white/10 hover:text-white group transition-colors">
                  <DollarSign className="mr-3 h-5 w-5 text-slate-400 group-hover:text-orange-500" />
                  Payouts
                </Link>
                <Link href="/restaurant/reviews" className="flex items-center px-2 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-white/10 hover:text-white group transition-colors">
                  <Star className="mr-3 h-5 w-5 text-slate-400 group-hover:text-orange-500" />
                  Reviews
                </Link>
                <Link href="/restaurant/messages" className="flex items-center px-2 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-white/10 hover:text-white group transition-colors">
                  <MessageSquare className="mr-3 h-5 w-5 text-slate-400 group-hover:text-orange-500" />
                  Messages
                </Link>
                 <Link href="/restaurant/settings" className="flex items-center px-2 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-white/10 hover:text-white group transition-colors">
                  <Settings className="mr-3 h-5 w-5 text-slate-400 group-hover:text-orange-500" />
                  Settings
                </Link>
              </>
            )}

            {/* Admin Navigation */}
            {viewRole === 'admin' && (
              <>
                <Link href="/admin" className="flex items-center px-2 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-white/10 hover:text-white group transition-colors">
                  <LayoutDashboard className="mr-3 h-5 w-5 text-slate-400 group-hover:text-orange-500" />
                  Dashboard
                </Link>
                <Link href="/admin/users" className="flex items-center px-2 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-white/10 hover:text-white group transition-colors">
                  <Users className="mr-3 h-5 w-5 text-slate-400 group-hover:text-orange-500" />
                  Users
                </Link>
                <Link href="/admin/hr" className="flex items-center px-2 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-white/10 hover:text-white group transition-colors">
                  <ClipboardCheck className="mr-3 h-5 w-5 text-slate-400 group-hover:text-orange-500" />
                  HR / Applications
                </Link>
                <Link href="/admin/restaurants" className="flex items-center px-2 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-white/10 hover:text-white group transition-colors">
                  <Store className="mr-3 h-5 w-5 text-slate-400 group-hover:text-orange-500" />
                  Restaurants
                </Link>
                <Link href="/admin/orders" className="flex items-center px-2 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-white/10 hover:text-white group transition-colors">
                  <List className="mr-3 h-5 w-5 text-slate-400 group-hover:text-orange-500" />
                  All Orders
                </Link>
                <Link href="/admin/analytics" className="flex items-center px-2 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-white/10 hover:text-white group transition-colors">
                  <BarChart3 className="mr-3 h-5 w-5 text-slate-400 group-hover:text-orange-500" />
                  Analytics
                </Link>
                <Link href="/admin/settings" className="flex items-center px-2 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-white/10 hover:text-white group transition-colors">
                  <Settings className="mr-3 h-5 w-5 text-slate-400 group-hover:text-orange-500" />
                  Settings
                </Link>
              </>
            )}

            {/* Customer Navigation (Updated to match Mockup) */}
            {viewRole !== 'driver' && viewRole !== 'restaurant' && viewRole !== 'admin' && (
              <>
                <Link href="/customer" className="flex items-center px-2 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-white/10 hover:text-white group transition-colors">
                  <Home className="mr-3 h-5 w-5 text-slate-400 group-hover:text-orange-500" />
                  Home
                </Link>
                <Link href="/customer/orders" className="flex items-center px-2 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-white/10 hover:text-white group transition-colors">
                  <Package className="mr-3 h-5 w-5 text-slate-400 group-hover:text-orange-500" />
                  Orders
                </Link>
                <Link href="/customer/favorites" className="flex items-center px-2 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-white/10 hover:text-white group transition-colors">
                  <Heart className="mr-3 h-5 w-5 text-slate-400 group-hover:text-orange-500" />
                  Favorites
                </Link>
                <Link href="/customer/addresses" className="flex items-center px-2 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-white/10 hover:text-white group transition-colors">
                  <MapPin className="mr-3 h-5 w-5 text-slate-400 group-hover:text-orange-500" />
                  Addresses
                </Link>
                <Link href="/customer/payments" className="flex items-center px-2 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-white/10 hover:text-white group transition-colors">
                  <CreditCard className="mr-3 h-5 w-5 text-slate-400 group-hover:text-orange-500" />
                  Payments
                </Link>
                <Link href="/customer/profile" className="flex items-center px-2 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-white/10 hover:text-white group transition-colors">
                  <Settings className="mr-3 h-5 w-5 text-slate-400 group-hover:text-orange-500" />
                  Settings
                </Link>
                <Link href="/customer/apply-to-drive" className="flex items-center px-2 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-white/10 hover:text-white group transition-colors">
                  <Grid className="mr-3 h-5 w-5 text-slate-400 group-hover:text-orange-500" />
                  Apply to Drive
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Favorite Restaurants (Only for Customers) */}
        {viewRole !== 'driver' && viewRole !== 'restaurant' && viewRole !== 'admin' && user && favorites.size > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Your Favorites</h3>
            <div className="space-y-1">
              {restaurants.filter(r => favorites.has(r.user_id)).map(r => (
                 <div key={r.user_id} className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-white/10 group transition-colors">
                    <Link href={`/customer/restaurant/${r.user_id}`} className="flex items-center truncate flex-1">
                      <span className="text-sm font-medium text-slate-300 group-hover:text-white truncate">{r.restaurant_name}</span>
                    </Link>
                    <button onClick={() => toggleFavorite(r.user_id)} className="ml-2">
                      <Heart className="h-4 w-4 fill-orange-500 text-orange-500" />
                    </button>
                 </div>
              ))}
            </div>
          </div>
        )}

        {/* All Restaurants List (Only for Customers) */}
        {viewRole !== 'driver' && viewRole !== 'restaurant' && viewRole !== 'admin' && (
          <div>
             <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">All Restaurants</h3>
             <div className="space-y-1">
                {restaurants.map(r => (
                  <div key={r.user_id} className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-white/10 group transition-colors">
                     <Link href={`/customer/restaurant/${r.user_id}`} className="flex items-center truncate flex-1">
                       <span className="text-sm font-medium text-slate-300 group-hover:text-white truncate">{r.restaurant_name}</span>
                     </Link>
                     <button onClick={() => toggleFavorite(r.user_id)} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Heart className={`h-4 w-4 ${favorites.has(r.user_id) ? 'fill-orange-500 text-orange-500' : 'text-slate-400 hover:text-orange-500'}`} />
                     </button>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-slate-700">
        {user ? (
          <div className="flex flex-col gap-2">
             <div className="flex items-center">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.email}</p>
                </div>
                <button onClick={handleSignOut} className="ml-2 p-2 text-slate-400 hover:text-white">
                  <LogOut className="h-5 w-5" />
                </button>
             </div>
             {/* Dev: Role Switcher */}
             <div className="relative">
                <select 
                  className="w-full text-xs border-slate-600 rounded-md bg-slate-800 text-slate-300 p-1 focus:ring-orange-500 focus:border-orange-500" 
                  value={viewRole || 'customer'}
                  onChange={(e) => setViewRole(e.target.value as any)}
                >
                  <option value="customer">View as Customer</option>
                  <option value="driver">View as Driver</option>
                  <option value="restaurant">View as Restaurant</option>
                  <option value="admin">View as Admin</option>
                </select>
             </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Link href="/login" className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-orange-600 bg-orange-100 hover:bg-orange-200">
              Log in
            </Link>
            <Link href="/register" className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700">
              Sign up
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
