'use client';

import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useState } from 'react';

export default function MenuItemCard({ item }: { item: any }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  const handleAddToCart = () => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      restaurantId: item.restaurant_id,
      notes: notes.trim() || undefined
    });
    setAdded(true);
    setNotes('');
    setShowNotes(false);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col">
      <div className="h-48 w-full relative bg-slate-100">
        {item.image_url ? (
            <Image 
              src={item.image_url} 
              alt={item.name}
              fill
              className="object-cover"
            />
        ) : (
           <div className="flex items-center justify-center h-full text-slate-400">No Image</div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
           <h3 className="text-lg font-semibold text-slate-900">{item.name}</h3>
           <span className="text-lg font-bold text-orange-600">${item.price}</span>
        </div>
        <p className="text-slate-500 text-sm mb-4 flex-1">{item.description}</p>
        
        {showNotes && (
          <div className="mb-4">
            <label htmlFor={`notes-${item.id}`} className="block text-xs font-medium text-slate-700 mb-1">
              Special Instructions (e.g., no onions)
            </label>
            <textarea
              id={`notes-${item.id}`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-sm p-2 border border-slate-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              rows={2}
              placeholder="Add notes..."
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          {!showNotes && !added && (
            <button
              onClick={() => setShowNotes(true)}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium text-left"
            >
              + Add Special Instructions
            </button>
          )}

          <div className="flex space-x-2">
            <button 
              onClick={handleAddToCart}
              disabled={added}
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                added 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                  : 'bg-orange-600 text-white hover:bg-orange-700'
              }`}
            >
              {added ? 'Added!' : 'Add to Cart'}
            </button>
            {added && (
              <a 
                href="/customer/cart"
                className="flex items-center justify-center px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors font-medium"
              >
                View Cart
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
