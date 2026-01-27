import DriverMap from '@/components/maps';
import Link from 'next/link';
import RestaurantGrid from '@/components/dashboard/RestaurantGrid';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row items-center justify-between mb-16">
         <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-4xl tracking-tight font-extrabold text-slate-900 sm:text-5xl md:text-6xl mb-6">
              <span className="block">Food delivery</span>
              <span className="block text-orange-600">at your doorstep</span>
            </h1>
            <p className="mt-3 text-base text-slate-500 sm:text-lg md:text-xl max-w-lg mb-8">
              Order from your favorite restaurants and track your delivery in real-time.
            </p>
            <Link href="/browse" className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-orange-600 hover:bg-orange-700 md:py-4 md:text-lg md:px-10 shadow-lg hover:shadow-xl transition-all">
              Order Now
            </Link>
         </div>
         <div className="md:w-1/2 relative">
             {/* Abstract Food Image Placeholder - Replace with actual assets */}
             <div className="relative h-[400px] w-full bg-gradient-to-tr from-orange-50 to-amber-50 rounded-3xl overflow-hidden flex items-center justify-center border border-orange-100/50">
                 <span className="text-6xl">🥗🍔🍕</span>
                 <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-orange-200/50 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                 <div className="absolute -top-10 -left-10 w-40 h-40 bg-yellow-200/50 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
             </div>
         </div>
      </div>

      {/* Category Filters */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
           <h2 className="text-2xl font-bold text-slate-900">Featured Restaurants</h2>
           <Link href="/browse" className="text-orange-600 hover:text-orange-700 font-medium transition-colors">See all</Link>
        </div>
        
        <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
           {['All', 'Pizza', 'Burgers', 'Sushi', 'Asian', 'Mexican', 'Desserts'].map((cat, idx) => (
             <Link 
               href={`/browse?category=${cat === 'All' ? '' : cat}`} 
               key={cat} 
               className={`px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${idx === 0 ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
             >
               {cat}
             </Link>
           ))}
        </div>
      </div>

      {/* Popular Restaurants Section */}
      <div className="mb-20">
          <RestaurantGrid enableDemo={true} />
      </div>

      {/* Live Tracking Demo */}
      <div className="mb-20 bg-slate-50 rounded-3xl p-8 md:p-12 overflow-hidden relative border border-slate-100">
        <div className="flex flex-col md:flex-row items-center gap-12">
           <div className="md:w-1/3 z-10">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Live Driver Tracking Demo</h2>
              <p className="text-slate-600 mb-6">Track your delivery in real-time with our advanced GPS integration. Know exactly when your food will arrive.</p>
              <div className="flex items-center space-x-2 text-emerald-600 font-medium">
                 <span className="relative flex h-3 w-3">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                 </span>
                 <span>Live Updates</span>
              </div>
           </div>
           <div className="md:w-2/3 w-full h-[400px] rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
              <DriverMap driverLat={40.7128} driverLng={-74.0060} />
           </div>
        </div>
      </div>

      {/* Why Choose UdryveFood Section */}
      <div className="mb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Why Choose UdryveFood?
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            We're revolutionizing food delivery with fair pay for drivers and better prices for you.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all text-center">
              <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">🚀</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Faster Service</h3>
              <p className="text-slate-600">Optimized delivery routes ensure your meals arrive hot and fresh.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all text-center">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">💰</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Better Prices</h3>
              <p className="text-slate-600">Affordable options without hidden fees or surprise charges.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all text-center">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">🤝</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Driver Care</h3>
              <p className="text-slate-600">Higher pay, insurance perks, and repair support for our fleet.</p>
            </div>
        </div>
      </div>
    </div>
  );
}
