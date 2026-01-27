import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { MapPin, Star } from 'lucide-react';
import Image from 'next/image';

export default async function RestaurantGrid({ enableDemo = false }: { enableDemo?: boolean }) {
  const supabase = await createClient();
  const { data: restaurants } = await supabase
    .from('restaurant_profiles')
    .select('*');

  const displayRestaurants = restaurants && restaurants.length > 0 ? restaurants : (enableDemo ? [
      { user_id: 'demo-1', restaurant_name: 'Burger King (Demo)', address: '123 Demo St, NY', cover_image: null },
      { user_id: 'demo-2', restaurant_name: 'Pizza Hut (Demo)', address: '456 Sample Ave, NY', cover_image: null },
      { user_id: 'demo-3', restaurant_name: 'Sushi World (Demo)', address: '789 Test Blvd, NY', cover_image: null },
  ] : []);

  if (displayRestaurants.length === 0) {
      return (
        <div className="text-center py-10">
            <p className="text-slate-500">No restaurants available at the moment.</p>
        </div>
      );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {displayRestaurants.map((r) => (
        <Link href={`/customer/restaurant/${r.user_id}`} key={r.user_id} className="block group">
           <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition h-full flex flex-col">
              <div className="h-48 bg-slate-200 relative">
                  {/* Placeholder for image - in real app would be r.cover_image */}
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-100 font-medium">
                     {r.restaurant_name.substring(0, 2).toUpperCase()}
                  </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                 <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-orange-600 transition line-clamp-1">{r.restaurant_name}</h3>
                    <div className="flex items-center bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-xs font-bold">
                        <Star size={12} className="mr-0.5 fill-current" />
                        4.8
                    </div>
                 </div>
                 <div className="flex items-start text-slate-500 text-sm mt-2 mb-4">
                    <MapPin size={14} className="mr-1 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{r.address}</span>
                 </div>
                 <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
                     <span className="text-slate-600">$$ • American</span>
                     <span className="text-slate-600 font-medium">15-25 min</span>
                 </div>
              </div>
           </div>
        </Link>
      ))}
    </div>
  );
}
