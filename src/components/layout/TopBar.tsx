'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, ShoppingCart, Bell, X, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { formatDistanceToNow } from 'date-fns';

export default function TopBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { itemCount } = useCart();
  const router = useRouter();
  const notificationRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchNotifications();
    fetchAvatar();

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        setNotifications((prev) => [payload.new, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAvatar = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('customer_profiles')
      .select('avatar_url')
      .eq('user_id', user.id)
      .single();
    
    if (profile?.avatar_url) {
        setAvatarUrl(profile.avatar_url);
    }
  };

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (data) setNotifications(data);
  };

  const handleNotificationClick = async (notification: any) => {
    // Mark as read
    if (!notification.is_read) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id);
      
      setNotifications(notifications.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
    }

    // Redirect if link exists
    if (notification.link) {
      router.push(notification.link);
      setShowNotifications(false);
    }
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/browse?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="bg-white border-b border-slate-100 shadow-sm h-16 fixed top-0 right-0 left-64 z-40 flex items-center justify-between px-8 transition-all duration-200">
      {/* Search Bar */}
      <div className="flex-1 max-w-2xl">
        <form onSubmit={handleSearch} className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-full leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:placeholder-slate-300 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all duration-200 text-slate-800"
            placeholder="Search for restaurants, food, or menu types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-6">
        {/* Notification Bell */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="text-slate-400 hover:text-slate-600 relative focus:outline-none transition-colors"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-orange-500 ring-2 ring-white"></span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50 border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <button 
                            onClick={markAllAsRead}
                            className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                        >
                            Mark all read
                        </button>
                    )}
                    <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                    <X className="h-4 w-4" />
                    </button>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  <div className="divide-y divide-slate-50">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${!notification.is_read ? 'bg-blue-50/30' : ''}`}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 pt-0.5">
                            {notification.type === 'success' ? (
                              <CheckCircle className="h-5 w-5 text-emerald-500" />
                            ) : notification.type === 'alert' || notification.type === 'warning' || notification.type === 'error' ? (
                              <AlertTriangle className="h-5 w-5 text-red-500" />
                            ) : (
                              <Info className="h-5 w-5 text-blue-500" />
                            )}
                          </div>
                          <div className="ml-3 w-0 flex-1">
                            <p className={`text-sm font-medium ${!notification.is_read ? 'text-slate-900' : 'text-slate-600'}`}>
                                {notification.title}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">{notification.message}</p>
                            <p className="mt-1 text-xs text-slate-400">
                                {notification.created_at ? formatDistanceToNow(new Date(notification.created_at), { addSuffix: true }) : ''}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <div className="ml-2 flex-shrink-0 flex self-center">
                                <span className="h-2 w-2 bg-orange-500 rounded-full"></span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-slate-500">
                    No new notifications
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-slate-100 text-center bg-slate-50/50">
                <button className="text-xs font-medium text-orange-600 hover:text-orange-700 transition-colors">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={() => router.push('/customer/cart')} 
          className="relative p-2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
        >
           <span className="sr-only">View cart</span>
           <ShoppingCart className="h-6 w-6" aria-hidden="true" />
           {itemCount > 0 && (
             <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-orange-500 rounded-full shadow-sm">
               {itemCount}
             </span>
           )}
        </button>
        
        {/* Profile Menu */}
        <button 
          onClick={() => router.push('/customer/profile')}
          className="flex items-center space-x-2 focus:outline-none group"
        >
          <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 group-hover:bg-slate-300 transition-colors overflow-hidden border border-slate-300">
            {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
                <span className="text-sm font-medium">JD</span>
            )}
          </div>
        </button>
      </div>
    </header>
  );
}
