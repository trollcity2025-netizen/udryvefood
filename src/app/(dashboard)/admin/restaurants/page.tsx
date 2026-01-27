'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Search, MapPin, Star, MoreVertical } from 'lucide-react';

export default function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchRestaurants = async () => {
      const { data, error } = await supabase
        .from('restaurant_profiles')
        .select('*');
      
      if (data) {
        setRestaurants(data);
      }
      setLoading(false);
    };

    fetchRestaurants();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Restaurants</h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Search restaurants..."
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-slate-900"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
        <ul className="divide-y divide-slate-100">
          {loading ? (
             <li className="p-4 text-center text-slate-500">Loading restaurants...</li>
          ) : restaurants.length === 0 ? (
             <li className="p-4 text-center text-slate-500">No restaurants found.</li>
          ) : (
            restaurants.map((restaurant) => (
              <li key={restaurant.user_id}>
                <div className="px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-slate-50/60">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-lg bg-slate-200 flex-shrink-0 overflow-hidden">
                       {restaurant.image_url ? (
                         <img src={restaurant.image_url} alt="" className="h-full w-full object-cover" />
                       ) : (
                         <div className="h-full w-full flex items-center justify-center text-slate-400">
                           <StoreIcon />
                         </div>
                       )}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-slate-900">{restaurant.restaurant_name}</h3>
                      <div className="flex items-center text-sm text-slate-500">
                        <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                        <p>{restaurant.address}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-sm text-slate-500">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span>4.5</span>
                    </div>
                    <span className="px-2.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active
                    </span>
                    <button className="text-slate-400 hover:text-slate-600 transition-colors">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
