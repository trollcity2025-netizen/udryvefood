import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { MapPin, Star, Clock, Info } from 'lucide-react';
import MenuItemCard from '@/components/menu/MenuItemCard';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function RestaurantPage({ params }: PageProps) {
  const supabase = await createClient();
  const { id } = await params;

  // Handle Demo Restaurants
  if (id.startsWith('demo-')) {
      const demoRestaurant = {
          restaurant_name: id === 'demo-1' ? 'Burger King (Demo)' : (id === 'demo-2' ? 'Pizza Hut (Demo)' : 'Sushi World (Demo)'),
          address: 'Demo Address, NY',
          user_id: id
      };
      
      const demoMenu = [
          { id: 'm1', name: 'Demo Burger', description: 'Delicious demo burger', price: 9.99, image_url: null, restaurant_id: id },
          { id: 'm2', name: 'Demo Fries', description: 'Crispy demo fries', price: 4.99, image_url: null, restaurant_id: id },
          { id: 'm3', name: 'Demo Drink', description: 'Refreshing demo drink', price: 2.99, image_url: null, restaurant_id: id },
      ];

      return (
        <div className="min-h-screen pb-20 bg-[#F5F6FA]">
          <div className="bg-white shadow-sm border-b border-slate-200">
            <div className="h-48 md:h-64 bg-slate-200 relative">
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-900/5 font-bold text-3xl">
                {demoRestaurant.restaurant_name}
              </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{demoRestaurant.restaurant_name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                <div className="flex items-center">
                  <Star size={16} className="text-emerald-500 fill-current mr-1" />
                  <span className="font-bold text-slate-900 mr-1">4.8</span>
                  <span className="text-slate-500">(Demo)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Menu</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {demoMenu.map((item) => (
                <MenuItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </div>
      );
  }

  // Fetch restaurant profile
  const { data: restaurant } = await supabase
    .from('restaurant_profiles')
    .select('*')
    .eq('user_id', id)
    .single();

  if (!restaurant) {
    notFound();
  }

  // Fetch menu items
  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', id);

  return (
    <div className="min-h-screen pb-20 bg-[#F5F6FA]">
      {/* Restaurant Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="h-48 md:h-64 bg-slate-200 relative">
             <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-900/5 font-bold text-3xl">
                {restaurant.restaurant_name}
             </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{restaurant.restaurant_name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                <div className="flex items-center">
                    <Star size={16} className="text-emerald-500 fill-current mr-1" />
                    <span className="font-bold text-slate-900 mr-1">4.8</span>
                    <span className="text-slate-500">(500+ ratings)</span>
                </div>
                <div className="flex items-center">
                    <MapPin size={16} className="mr-1" />
                    {restaurant.address}
                </div>
                <div className="flex items-center">
                    <Clock size={16} className="mr-1" />
                    20-30 min
                </div>
                <div className="flex items-center">
                    <Info size={16} className="mr-1" />
                    $$ • Burgers • American
                </div>
            </div>
        </div>
      </div>

      {/* Menu Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Menu</h2>
        
        {menuItems && menuItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item) => (
                <MenuItemCard key={item.id} item={item} />
            ))}
            </div>
        ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
                <p className="text-slate-500">No menu items available.</p>
            </div>
        )}
      </div>
    </div>
  );
}
