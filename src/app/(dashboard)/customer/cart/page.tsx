'use client';

import { useCart } from '@/context/CartContext';
import { Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { items, removeItem, total, clearCart } = useCart();
  const router = useRouter();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-3xl font-extrabold text-slate-900">Your Cart is Empty</h2>
        <p className="mt-4 text-slate-500">Looks like you haven't added anything yet.</p>
        <Link href="/browse" className="mt-8 inline-block bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 shadow-sm hover:shadow transition-all">
          Browse Restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Your Cart</h1>
      
      <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
        <ul className="divide-y divide-slate-100">
          {items.map((item, idx) => (
            <li key={`${item.id}-${idx}`} className="px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-slate-900">{item.name}</h3>
                <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                {item.notes && (
                  <p className="text-sm text-orange-600 italic mt-1">
                     Note: {item.notes}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-6">
                <span className="text-lg font-bold text-slate-900">${(item.price * item.quantity).toFixed(2)}</span>
                <button 
                  onClick={() => removeItem(item.id, item.notes)}
                  className="text-slate-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-full"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="px-4 py-6 sm:px-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
            <span className="text-lg font-medium text-slate-900">Total</span>
            <span className="text-3xl font-bold text-slate-900">${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-8 flex justify-end space-x-4">
        <button 
           onClick={clearCart}
           className="px-6 py-3 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          Clear Cart
        </button>
        <Link 
          href="/customer/checkout"
          className="px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 shadow-sm hover:shadow transition-all"
        >
          Proceed to Checkout
        </Link>
      </div>
    </div>
  );
}
