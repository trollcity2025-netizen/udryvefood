import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import MenuItemCard from '@/components/menu/MenuItemCard';
import { DEMO_RESTAURANTS, DEMO_MENU_ITEMS } from '@/data/demoRestaurants';

export default async function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  let restaurant = null;
  let menuItems: any[] = [];

  // Check if it's a demo ID
  if (id.startsWith('demo-')) {
    restaurant = DEMO_RESTAURANTS.find(r => r.user_id === id);
    menuItems = DEMO_MENU_ITEMS[id as keyof typeof DEMO_MENU_ITEMS] || [];
  } else {
    // Fetch restaurant details from DB
    const { data: dbRestaurant } = await supabase
      .from('restaurant_profiles')
      .select('*')
      .eq('user_id', id)
      .single();
    
    restaurant = dbRestaurant;

    if (restaurant) {
      // Fetch menu items from DB
      const { data: dbMenuItems } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', id)
        .eq('is_available', true);
      
      menuItems = dbMenuItems || [];
    }
  }

  if (!restaurant) {
    return notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/browse" className="text-orange-600 hover:text-orange-500 mb-4 inline-block">&larr; Back to Restaurants</Link>
      
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8 border border-slate-100">
        <div className="h-64 w-full relative bg-slate-200">
           {restaurant.image_url && (
              <Image 
                src={restaurant.image_url} 
                alt={restaurant.restaurant_name}
                fill
                className="object-cover"
              />
           )}
           {id.startsWith('demo-') && (
              <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 font-bold px-3 py-1 rounded shadow">
                DEMO MODE
              </div>
           )}
           <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
              <div className="p-6 text-white">
                <h1 className="text-4xl font-bold">{restaurant.restaurant_name}</h1>
                <p className="mt-2 text-lg opacity-90">{restaurant.address}</p>
              </div>
           </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 mb-6">Menu</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems && menuItems.length > 0 ? (
          menuItems.map((item) => (
            <MenuItemCard key={item.id} item={item} />
          ))
        ) : (
          <div className="col-span-full text-center py-10">
            <p className="text-slate-500">No menu items available.</p>
          </div>
        )}
      </div>
    </div>
  );
}
