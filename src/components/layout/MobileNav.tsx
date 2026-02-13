'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingCart, User, Heart, LayoutDashboard, ClipboardList, DollarSign, MessageSquare, UtensilsCrossed, Settings, Store } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAdminView } from '@/context/AdminViewContext';

export default function MobileNav() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { viewRole } = useAdminView();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname === path || pathname?.startsWith(path + '/');
  };

  const renderDriverNav = () => (
    <>
      <Link href="/driver" className={`flex flex-col items-center justify-center w-full h-full ${pathname === '/driver' ? 'text-orange-600' : 'text-slate-500'}`}>
        <LayoutDashboard size={24} />
        <span className="text-[10px] mt-1">Dash</span>
      </Link>
      <Link href="/driver/orders/available" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/driver/orders') ? 'text-orange-600' : 'text-slate-500'}`}>
        <ClipboardList size={24} />
        <span className="text-[10px] mt-1">Orders</span>
      </Link>
      <Link href="/driver/earnings" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/driver/earnings') ? 'text-orange-600' : 'text-slate-500'}`}>
        <DollarSign size={24} />
        <span className="text-[10px] mt-1">Earnings</span>
      </Link>
      <Link href="/driver/messages" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/driver/messages') ? 'text-orange-600' : 'text-slate-500'}`}>
        <MessageSquare size={24} />
        <span className="text-[10px] mt-1">Chat</span>
      </Link>
      <Link href="/driver/settings" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/driver/settings') ? 'text-orange-600' : 'text-slate-500'}`}>
        <Settings size={24} />
        <span className="text-[10px] mt-1">Settings</span>
      </Link>
    </>
  );

  const renderRestaurantNav = () => (
    <>
      <Link href="/restaurant" className={`flex flex-col items-center justify-center w-full h-full ${pathname === '/restaurant' ? 'text-orange-600' : 'text-slate-500'}`}>
        <Store size={24} />
        <span className="text-[10px] mt-1">Dash</span>
      </Link>
      <Link href="/restaurant/orders" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/restaurant/orders') ? 'text-orange-600' : 'text-slate-500'}`}>
        <ClipboardList size={24} />
        <span className="text-[10px] mt-1">Orders</span>
      </Link>
      <Link href="/restaurant/menu" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/restaurant/menu') ? 'text-orange-600' : 'text-slate-500'}`}>
        <UtensilsCrossed size={24} />
        <span className="text-[10px] mt-1">Menu</span>
      </Link>
      <Link href="/restaurant/payouts" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/restaurant/payouts') ? 'text-orange-600' : 'text-slate-500'}`}>
        <DollarSign size={24} />
        <span className="text-[10px] mt-1">Payouts</span>
      </Link>
      <Link href="/restaurant/settings" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/restaurant/settings') ? 'text-orange-600' : 'text-slate-500'}`}>
        <Settings size={24} />
        <span className="text-[10px] mt-1">Settings</span>
      </Link>
    </>
  );

  const renderCustomerNav = () => (
    <>
        <Link href="/" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/') && pathname === '/' ? 'text-orange-600' : 'text-slate-500'}`}>
          <Home size={24} />
          <span className="text-[10px] mt-1">Home</span>
        </Link>
        
        <Link href="/browse" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/browse') ? 'text-orange-600' : 'text-slate-500'}`}>
          <Search size={24} />
          <span className="text-[10px] mt-1">Browse</span>
        </Link>
        
        <Link href="/customer/cart" className={`flex flex-col items-center justify-center w-full h-full relative ${isActive('/customer/cart') ? 'text-orange-600' : 'text-slate-500'}`}>
          <div className="relative">
            <ShoppingCart size={24} />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1">Cart</span>
        </Link>
        
        <Link href="/customer/favorites" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/customer/favorites') ? 'text-orange-600' : 'text-slate-500'}`}>
          <Heart size={24} />
          <span className="text-[10px] mt-1">Saved</span>
        </Link>
        
        <Link href="/customer/profile" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/customer/profile') ? 'text-orange-600' : 'text-slate-500'}`}>
          <User size={24} />
          <span className="text-[10px] mt-1">Account</span>
        </Link>
    </>
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 md:hidden pb-safe">
      <div className="flex justify-around items-center h-16">
        {viewRole === 'driver' && renderDriverNav()}
        {viewRole === 'restaurant' && renderRestaurantNav()}
        {/* Admin also sees customer view or can have specific view, defaulting to customer for now */}
        {(viewRole === 'customer' || viewRole === 'admin') && renderCustomerNav()}
      </div>
    </div>
  );
}