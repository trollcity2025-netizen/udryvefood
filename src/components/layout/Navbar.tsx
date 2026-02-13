'use client';

import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useAdminView } from '@/context/AdminViewContext';
import { ShoppingCart, User, Shield, Truck, Utensils, Menu, LogOut, ChevronDown } from 'lucide-react';
import { Fragment, useEffect, useState } from 'react';
import { Menu as HeadlessMenu, Transition } from '@headlessui/react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { itemCount } = useCart();
  const { isRealAdmin, viewRole, setViewRole } = useAdminView();
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  const router = useRouter();
  
  // Safe access to avatar url
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
    router.refresh();
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    switch (viewRole) {
      case 'admin': return '/admin';
      case 'driver': return '/driver';
      case 'restaurant': return '/restaurant';
      default: return '/customer';
    }
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      {/* Admin Impersonation Banner */}
      {isRealAdmin && viewRole !== 'admin' && (
        <div className="bg-indigo-600 text-white text-center text-sm py-1 px-4 flex justify-between items-center">
            <span>You are viewing as <strong>{viewRole.toUpperCase()}</strong></span>
            <button 
                onClick={() => setViewRole('admin')}
                className="text-xs bg-white text-indigo-600 px-2 py-0.5 rounded font-bold hover:bg-indigo-50"
            >
                Exit View
            </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href={getDashboardLink()} className="flex-shrink-0 flex items-center gap-2">
              <div className="relative h-12 w-12">
                {/* Placeholder logo until uploaded */}
                <span className="text-4xl">🍔</span>
              </div>
              <span className="text-2xl font-bold text-orange-600 hidden md:block tracking-tight">UdryveFood</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/browse" className="border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                Browse
              </Link>
              {viewRole === 'customer' && user && (
                 <Link href="/customer/orders" className="border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                   Orders
                 </Link>
              )}
              {(viewRole === 'driver' || viewRole === 'admin') && (
                 <Link href="/driver" className="border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                   Driver Dashboard
                 </Link>
              )}
               {(viewRole === 'restaurant' || viewRole === 'admin') && (
                 <Link href="/restaurant" className="border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                   Restaurant Dashboard
                 </Link>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
             {/* Admin Switcher Dropdown */}
             {isRealAdmin && (
                <HeadlessMenu as="div" className="relative ml-3">
                  <HeadlessMenu.Button className="bg-indigo-100 p-1 rounded-full text-indigo-600 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <span className="sr-only">Switch Role</span>
                    <Shield className="h-6 w-6" aria-hidden="true" />
                  </HeadlessMenu.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <HeadlessMenu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50 border border-slate-100">
                      <div className="px-4 py-2 text-xs text-slate-500 border-b border-slate-100">View As...</div>
                      <HeadlessMenu.Item>
                        {({ active }) => (
                          <button onClick={() => setViewRole('admin')} className={`${active ? 'bg-slate-50' : ''} block w-full text-left px-4 py-2 text-sm text-slate-700`}>
                            <Shield className="inline-block w-4 h-4 mr-2"/> Admin
                          </button>
                        )}
                      </HeadlessMenu.Item>
                      <HeadlessMenu.Item>
                        {({ active }) => (
                          <button onClick={() => setViewRole('customer')} className={`${active ? 'bg-slate-50' : ''} block w-full text-left px-4 py-2 text-sm text-slate-700`}>
                            <User className="inline-block w-4 h-4 mr-2"/> Customer
                          </button>
                        )}
                      </HeadlessMenu.Item>
                      <HeadlessMenu.Item>
                        {({ active }) => (
                          <button onClick={() => setViewRole('driver')} className={`${active ? 'bg-slate-50' : ''} block w-full text-left px-4 py-2 text-sm text-slate-700`}>
                            <Truck className="inline-block w-4 h-4 mr-2"/> Driver
                          </button>
                        )}
                      </HeadlessMenu.Item>
                      <HeadlessMenu.Item>
                        {({ active }) => (
                          <button onClick={() => setViewRole('restaurant')} className={`${active ? 'bg-slate-50' : ''} block w-full text-left px-4 py-2 text-sm text-slate-700`}>
                            <Utensils className="inline-block w-4 h-4 mr-2"/> Restaurant
                          </button>
                        )}
                      </HeadlessMenu.Item>
                    </HeadlessMenu.Items>
                  </Transition>
                </HeadlessMenu>
             )}

             <Link href="/customer/cart" className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
               <span className="sr-only">View cart</span>
               <ShoppingCart className="h-6 w-6" aria-hidden="true" />
               {itemCount > 0 && (
                 <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                   {itemCount}
                 </span>
               )}
             </Link>
            
            {user ? (
               <HeadlessMenu as="div" className="relative ml-3">
                  <HeadlessMenu.Button className="flex items-center max-w-xs text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
                    <span className="sr-only">Open user menu</span>
                    {avatarUrl ? (
                      <div className="h-8 w-8 rounded-full overflow-hidden border border-orange-200">
                        <Image 
                          src={avatarUrl} 
                          alt="Profile" 
                          width={32} 
                          height={32} 
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold border border-orange-200">
                          {user.email?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="ml-2 text-slate-700 hidden md:block max-w-[150px] truncate">{user.email}</span>
                    <ChevronDown className="ml-1 h-4 w-4 text-slate-400" />
                  </HeadlessMenu.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <HeadlessMenu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50 border border-slate-100">
                      <div className="px-4 py-2 border-b border-slate-100">
                          <p className="text-sm font-medium text-slate-900 truncate">{user.email}</p>
                          <p className="text-xs text-slate-500 capitalize">{user.user_metadata?.role || 'Customer'}</p>
                      </div>
                      <HeadlessMenu.Item>
                        {({ active }) => (
                          <Link href="/customer/profile" className={`${active ? 'bg-slate-50' : ''} block px-4 py-2 text-sm text-slate-700`}>
                            Your Profile
                          </Link>
                        )}
                      </HeadlessMenu.Item>
                      <HeadlessMenu.Item>
                        {({ active }) => (
                          <Link href="/customer/orders" className={`${active ? 'bg-slate-50' : ''} block px-4 py-2 text-sm text-slate-700`}>
                            Your Orders
                          </Link>
                        )}
                      </HeadlessMenu.Item>
                      <HeadlessMenu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleSignOut}
                            className={`${active ? 'bg-slate-50' : ''} block w-full text-left px-4 py-2 text-sm text-red-600`}
                          >
                            Sign out
                          </button>
                        )}
                      </HeadlessMenu.Item>
                    </HeadlessMenu.Items>
                  </Transition>
               </HeadlessMenu>
            ) : (
              <>
                <Link href="/login" className="text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                  Log in
                </Link>
                <Link href="/register" className="bg-orange-600 text-white hover:bg-orange-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:shadow transition-all">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
