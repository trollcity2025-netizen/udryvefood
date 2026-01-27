import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star, Clock } from 'lucide-react';

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const query = params.q?.toLowerCase() || '';
  const category = params.category || '';

  let restaurantIds = new Set<string>();
  let restaurants = [];

  // 1. Fetch matching restaurants from DB
  if (query || category) {
    // If filtering by category or searching food items, we need to check menu_items
    let menuQuery = supabase.from('menu_items').select('restaurant_id');
    
    if (category) {
      menuQuery = menuQuery.ilike('category', `%${category}%`);
    }
    if (query) {
       // Search in menu items name or category or description
       // Note: Supabase 'or' syntax: .or('name.ilike.%query%,category.ilike.%query%')
       menuQuery = menuQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`);
    }

    const { data: menuMatches } = await menuQuery;
    
    if (menuMatches) {
      menuMatches.forEach((m) => restaurantIds.add(m.restaurant_id));
    }

    // Also search restaurant names if query exists
    if (query) {
      const { data: nameMatches } = await supabase
        .from('restaurant_profiles')
        .select('user_id')
        .ilike('restaurant_name', `%${query}%`);
      
      if (nameMatches) {
        nameMatches.forEach((m) => restaurantIds.add(m.user_id));
      }
    }

    // If we have IDs, fetch those profiles
    if (restaurantIds.size > 0) {
      const { data: dbRestaurants } = await supabase
        .from('restaurant_profiles')
        .select('*')
        .in('user_id', Array.from(restaurantIds))
        .eq('is_open', true);
      
      restaurants = dbRestaurants || [];
    } else {
        // No matches found in DB (or DB empty), check if we should fall back to demo or show nothing
        // If specific search yielded no IDs, result is empty.
        // However, if DB is empty, we might want to search demo data.
        restaurants = [];
    }
  } else {
    // No filter, fetch all
    const { data: dbRestaurants } = await supabase.from('restaurant_profiles').select('*').eq('is_open', true);
    restaurants = dbRestaurants || [];
  }

  // Fallback to Demo Data if DB returns nothing AND we are likely in a demo environment
  // OR if we want to always mix in demo data for this project showcase
  // Removed hardcoded fallback as per requirements

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
            {query ? `Search results for "${query}"` : (category ? `${category} Restaurants` : 'Browse Restaurants')}
        </h1>
        <div className="flex space-x-2">
            {['All', 'Pizza', 'Burgers', 'Sushi'].map(cat => (
                <Link 
                    key={cat} 
                    href={`/browse?category=${cat === 'All' ? '' : cat}`}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${category === cat || (cat === 'All' && !category) ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                    {cat}
                </Link>
            ))}
        </div>
      </div>

      {restaurants.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
              <p className="text-slate-500 text-lg">No restaurants found matching your criteria.</p>
              <Link href="/browse" className="mt-4 inline-block text-orange-600 hover:text-orange-700 font-medium">Clear filters</Link>
          </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {restaurants.map((restaurant) => (
            <Link key={restaurant.user_id} href={`/customer/restaurant/${restaurant.user_id}`} className="block group">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col border border-slate-100">
                <div className="h-48 w-full relative bg-slate-200 overflow-hidden">
                  {restaurant.image_url ? (
                     <Image 
                       src={restaurant.image_url} 
                       alt={restaurant.restaurant_name}
                       fill
                       className="object-cover group-hover:scale-105 transition-transform duration-500"
                     />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-300 bg-slate-100 font-bold text-2xl">
                      {restaurant.restaurant_name.substring(0,2).toUpperCase()}
                    </div>
                  )}
                  {/* Overlay Info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-10">
                      <h3 className="text-white font-bold text-xl truncate shadow-sm">{restaurant.restaurant_name}</h3>
                  </div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex items-start text-slate-500 text-sm mb-3">
                            <MapPin size={16} className="mr-1.5 mt-0.5 flex-shrink-0 text-slate-400" />
                            <span className="line-clamp-1">{restaurant.address || '123 Food Street'}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-slate-600">
                            <div className="flex items-center bg-slate-50 px-2 py-1 rounded-md">
                                <Star size={14} className="text-yellow-400 fill-current mr-1" />
                                <span className="font-semibold text-slate-700">4.5</span>
                            </div>
                            <div className="flex items-center">
                                <Clock size={14} className="mr-1 text-slate-400" />
                                <span>20-30 min</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center">
                         <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                            {restaurant.restaurant_name.includes('Pizza') ? 'Italian' : (restaurant.restaurant_name.includes('Sushi') ? 'Japanese' : 'American')}
                         </span>
                         <span className="text-sm font-medium text-slate-900">$$</span>
                    </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
