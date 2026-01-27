'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Trash2, Plus } from 'lucide-react';
import Image from 'next/image';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
}

export default function MenuManagement() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const supabase = createClient();
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', user.id);
      setItems(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      await supabase.from('menu_items').delete().eq('id', id);
      fetchItems();
    }
  };

  const handleSeed = async () => {
    setLoading(true);
    const { error } = await supabase.rpc('seed_sample_menu');
    if (error) {
        alert('Error seeding data: ' + error.message);
    } else {
        fetchItems();
    }
    setLoading(false);
  }

  const onSubmit = async (data: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('menu_items').insert({
      restaurant_id: user.id,
      name: data.name,
      description: data.description,
      price: parseFloat(data.price),
      image_url: data.image_url || null, // Optional
    });
    
    setIsCreating(false);
    reset();
    fetchItems();
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading menu...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Menu Management</h1>
        <div className="space-x-4">
            <button
                onClick={handleSeed}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
            >
                Load Sample Data
            </button>
            <button
                onClick={() => setIsCreating(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-orange-600 hover:bg-orange-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
            >
                <Plus size={16} className="mr-2" />
                Add Item
            </button>
        </div>
      </div>

      {isCreating && (
        <div className="bg-slate-50/60 p-6 rounded-xl mb-8 border border-slate-200">
          <h3 className="text-lg font-medium mb-4 text-slate-900">Add New Item</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Name</label>
              <input {...register('name', { required: true })} className="mt-1 block w-full rounded-lg border-slate-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2.5 border text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Description</label>
              <textarea {...register('description')} className="mt-1 block w-full rounded-lg border-slate-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2.5 border text-slate-900" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                <label className="block text-sm font-medium text-slate-700">Price ($)</label>
                <input type="number" step="0.01" {...register('price', { required: true })} className="mt-1 block w-full rounded-lg border-slate-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2.5 border text-slate-900" />
                </div>
                <div>
                <label className="block text-sm font-medium text-slate-700">Image URL</label>
                <input type="text" {...register('image_url')} placeholder="https://..." className="mt-1 block w-full rounded-lg border-slate-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2.5 border text-slate-900" />
                </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors">Save Item</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow-sm overflow-hidden sm:rounded-xl border border-slate-200">
        <ul className="divide-y divide-slate-200">
          {items.map((item) => (
            <li key={item.id} className="px-4 py-4 flex items-center justify-between sm:px-6 hover:bg-slate-50/60">
              <div className="flex items-center">
                <div className="h-16 w-16 relative bg-slate-200 rounded-lg overflow-hidden flex-shrink-0">
                    {item.image_url ? (
                        <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                    ) : (
                        <div className="flex items-center justify-center h-full text-xs text-slate-400">No Img</div>
                    )}
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-slate-900">{item.name}</h4>
                  <p className="text-sm text-slate-500">{item.description}</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">${item.price}</p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                className="text-red-600 hover:text-red-900 p-2"
                title="Delete Item"
              >
                <Trash2 size={20} />
              </button>
            </li>
          ))}
          {items.length === 0 && (
            <li className="px-4 py-8 text-center text-slate-500">
              No items yet. Click "Add Item" or "Load Sample Data" to get started.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
