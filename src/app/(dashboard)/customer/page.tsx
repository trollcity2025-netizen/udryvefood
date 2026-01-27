'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, MapPin, ChevronRight, Star, CreditCard, ShoppingBag, Truck, Calendar, Heart } from 'lucide-react';
import Image from 'next/image';

export default function CustomerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('current');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  // Mock Data for Dashboard
  const activeOrders = [
    {
      id: '#1234',
      restaurant: 'Pasta Palace',
      rating: 4.8,
      ratingCount: 51,
      items: [
        { name: '1 Margherita Pizza', price: '$18.99' },
        { name: '1 Chicken Alfredo', price: '$14.45' }
      ],
      status: 'On the way',
      eta: '1:10 pm',
      driver: { name: 'Delivery', type: 'Scooter' },
      image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    },
    {
      id: '#1235',
      restaurant: 'Sushi House',
      rating: 4.9,
      ratingCount: 768,
      items: [
        { name: '2 Salmon Nigiri', price: '$5.40' },
        { name: '1 California Roll', price: '$3.50' }
      ],
      status: 'Arriving Soon',
      eta: '12:45 pm',
      driver: { name: 'Delivery', type: 'Car' },
      image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    }
  ];

  const pastOrders = [
    {
      id: '#1101',
      restaurant: 'Sushi House',
      rating: 4.5,
      ratingCount: 4092,
      date: 'April 18, 2024',
      status: 'Delivered',
      image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    },
    {
      id: '#1089',
      restaurant: 'Tuna Alley',
      rating: 4.8,
      ratingCount: 851,
      date: 'April 10, 2024',
      status: 'Delivered',
      image: 'https://images.unsplash.com/photo-1599043513900-be6febca9d4d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    },
     {
      id: '#1055',
      restaurant: 'Burger Nation',
      rating: 4.6,
      ratingCount: 914,
      date: 'April 2, 2024',
      status: 'Delivered',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    }
  ];

  const savedAddresses = [
    { type: 'Home', address: '122 Main St, Apt 48, Brooklyn, NY', label: 'Primary' },
    { type: 'Boxywork-Loft Space', address: '604, Ofc Ane Sulo. 36, Brooklyn, NY', label: '' },
    { type: 'Joey\'s House', address: '408 Ethweed Ave, Brooklyn, NY', label: '' }
  ];

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();
  }, []);

  if (loading) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-slate-50/50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Customer Dashboard</h1>
        <p className="text-slate-600 mt-1">Welcome back, {user?.user_metadata?.full_name || 'Sarah Miller'}!</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-all">
               <div className="relative z-10">
                 <div className="flex justify-between items-start">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Active Orders</p>
                        <h3 className="text-3xl font-bold mt-2 text-slate-900">2</h3>
                    </div>
                    <div className="p-3 bg-sky-50 rounded-lg text-sky-500">
                        <Truck className="h-6 w-6" />
                    </div>
                 </div>
                 <div className="mt-4 flex items-center text-xs text-orange-600 font-medium cursor-pointer hover:underline">
                    <span>View All</span>
                    <ChevronRight className="h-3 w-3 ml-1" />
                 </div>
               </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-all">
               <div className="relative z-10">
                 <div className="flex justify-between items-start">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Pending</p>
                        <h3 className="text-3xl font-bold mt-2 text-slate-900">1</h3>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg text-blue-500">
                        <ShoppingBag className="h-6 w-6" />
                    </div>
                 </div>
                 <div className="mt-4 flex items-center text-xs text-slate-500 font-medium">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">Arriving 1:10 pm</span>
                 </div>
               </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
               <div className="relative z-10">
                 <div className="flex justify-between items-start">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Total Orders</p>
                        <h3 className="text-3xl font-bold mt-2 text-slate-900">16</h3>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-lg text-emerald-500">
                        <Calendar className="h-6 w-6" />
                    </div>
                 </div>
                 <div className="mt-4 flex items-center text-xs text-emerald-600 font-medium cursor-pointer hover:underline">
                    <span>View History</span>
                    <ChevronRight className="h-3 w-3 ml-1" />
                 </div>
               </div>
            </div>
          </div>

          {/* Current Orders */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Current Orders</h2>
              <div className="flex space-x-2">
                 <button className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-600 transition-colors"><ChevronRight className="h-4 w-4 rotate-180" /></button>
                 <button className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-600 transition-colors"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>

            <div className="space-y-4">
              {activeOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="h-16 w-16 rounded-lg overflow-hidden flex-shrink-0 relative">
                        <Image src={order.image} alt={order.restaurant} fill className="object-cover" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">{order.restaurant}</h3>
                        <div className="flex items-center text-xs text-orange-500 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-3 w-3 fill-current ${i >= Math.floor(order.rating) ? 'text-slate-200 fill-slate-200' : ''}`} />
                          ))}
                          <span className="ml-1 text-slate-500">({order.ratingCount})</span>
                        </div>
                        <div className="space-y-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center text-sm text-slate-600">
                               <span className="w-5 h-5 flex items-center justify-center bg-slate-100 rounded text-[10px] mr-2 text-slate-500 font-medium">1</span>
                               <span>{item.name}</span>
                               <span className="ml-2 text-slate-400 font-medium text-xs">{item.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
                         {order.status}
                       </span>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center text-sm text-slate-600">
                      <MapPin className="h-4 w-4 mr-1 text-slate-400" />
                      <span>Arriving at <span className="font-bold text-slate-900">{order.eta}</span> · {order.driver.name} ({order.driver.type})</span>
                    </div>
                    <div className="flex space-x-3">
                      <button className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors shadow-sm shadow-orange-200">
                        Track Order
                      </button>
                      <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
                        Contact Driver
                      </button>
                       <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Past Orders */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Past Orders</h2>
              <button className="text-sm text-slate-500 hover:text-orange-600 flex items-center transition-colors">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 divide-y divide-slate-100">
              {pastOrders.map((order) => (
                <div key={order.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                   <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full overflow-hidden flex-shrink-0 relative">
                        <Image src={order.image} alt={order.restaurant} fill className="object-cover" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{order.restaurant}</h4>
                        <div className="flex items-center text-xs text-orange-500">
                           <Star className="h-3 w-3 fill-current" />
                           <Star className="h-3 w-3 fill-current" />
                           <Star className="h-3 w-3 fill-current" />
                           <Star className="h-3 w-3 fill-current" />
                           <Star className="h-3 w-3 fill-slate-200 text-slate-200" />
                           <span className="ml-1 text-slate-400">({order.ratingCount})</span>
                        </div>
                      </div>
                   </div>
                   
                   <div className="text-sm text-slate-500 hidden sm:block">
                     Delivered on <span className="font-medium text-slate-900">{order.date}</span>
                   </div>
                   
                   <div className="flex items-center text-emerald-600 text-sm font-medium">
                     {order.status} <ChevronRight className="h-4 w-4 ml-2 text-slate-300" />
                   </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column (Sidebar Widgets) */}
        <div className="space-y-8">
           {/* Account Summary */}
           <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Account Summary</h3>
              
              <div className="flex items-center justify-between mb-6">
                <span className="text-slate-500">Total Credits</span>
                <span className="text-2xl font-bold text-emerald-600">$20.00</span>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Member Since</span>
                  <span className="font-medium text-slate-900">February 2021</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Rating</span>
                  <div className="flex items-center text-orange-500">
                    <Star className="h-3 w-3 fill-current" />
                    <Star className="h-3 w-3 fill-current" />
                    <Star className="h-3 w-3 fill-current" />
                    <span className="ml-1 font-medium text-slate-900">15</span>
                    <span className="ml-1 text-slate-400 text-xs">18 out of 5.0</span>
                  </div>
                </div>
              </div>
           </div>

           {/* Favorite Restaurants */}
           <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-lg font-bold text-slate-900">Favorite Restaurants</h3>
                 <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
              
              <div className="rounded-lg overflow-hidden relative mb-3 h-32 w-full">
                 <Image 
                   src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" 
                   alt="Burger Nation" 
                   fill
                   className="object-cover"
                 />
                 <div className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-sm">
                   <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                 </div>
              </div>
              
              <h4 className="font-bold text-slate-900">Burger Nation</h4>
              <div className="flex items-center text-sm text-slate-500 mt-1">
                 <span className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-medium mr-2 text-slate-600">Burger</span>
                 <Star className="h-3 w-3 fill-orange-500 text-orange-500 mr-1" />
                 <span className="text-slate-900 font-medium">4.7</span>
                 <span className="mx-1">·</span>
                 <span>Burger</span>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                 <span className="text-sm font-medium text-slate-900">Partner</span>
                 <button className="text-xs bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-full text-slate-600 font-medium transition-colors border border-slate-200">
                   View All
                 </button>
              </div>
           </div>

           {/* Saved Addresses */}
           <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-lg font-bold text-slate-900">Saved Addresses</h3>
                 {/* <ChevronRight className="h-4 w-4 text-slate-400" /> */}
              </div>
              
              <div className="space-y-4">
                 {savedAddresses.map((addr, idx) => (
                   <div key={idx} className="flex items-start group cursor-pointer">
                      <div className="mt-1 mr-3 p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                         <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-900 text-sm">{addr.type}</h4>
                            {addr.label && <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-bold uppercase">{addr.label}</span>}
                         </div>
                         <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{addr.address}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 self-center group-hover:text-orange-400" />
                   </div>
                 ))}
              </div>
              
              <button className="mt-6 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium rounded-lg transition-colors flex items-center justify-center border border-slate-200 border-dashed hover:border-solid hover:border-slate-300">
                 <span className="mr-1">+</span> Add New Address
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}