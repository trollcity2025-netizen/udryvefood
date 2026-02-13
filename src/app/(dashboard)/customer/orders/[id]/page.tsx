import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, MapPin, Phone } from 'lucide-react';

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>Please log in</div>;
  }

  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      restaurant:restaurant_profiles(*),
      driver:driver_profiles(*),
      items:order_items(
        *,
        menu_item:menu_items(*)
      )
    `)
    .eq('id', id)
    .single();

  if (!order) {
    notFound();
  }

  // Security check: Ensure order belongs to user
  if (order.customer_id !== user.id && user.user_metadata?.role !== 'admin') {
     return <div className="p-8 text-center text-red-600">Access Denied</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/customer/orders" className="inline-flex items-center text-slate-500 hover:text-slate-700 mb-6 transition-colors">
        <ChevronLeft size={20} className="mr-1" /> Back to Orders
      </Link>

      <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-slate-100">
          <div>
             <h1 className="text-xl font-bold text-slate-900">Order Confirmed</h1>
             <p className="text-slate-500 text-sm">Order #{order.id}</p>
          </div>
          <div className="text-right">
             <p className="text-sm text-slate-500">Status</p>
             <p className="font-bold uppercase tracking-wide text-orange-600">{order.status}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* Order Items */}
           <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">Items Ordered</h2>
              <ul className="divide-y divide-slate-100">
                {order.items.map((item: any) => (
                  <li key={item.id} className="py-3 flex justify-between">
                    <div>
                      <span className="font-medium text-slate-900">{item.quantity}x</span>{' '}
                      <span className="text-slate-700">{item.menu_item?.name || 'Unknown Item'}</span>
                    </div>
                    <span className="text-slate-900 font-medium">${item.price_at_time}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-slate-200 mt-4 pt-4 flex justify-between items-center font-bold text-lg text-slate-900">
                <span>Total</span>
                <span>${order.total_amount}</span>
              </div>
           </div>

           {/* Delivery Info */}
           <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Delivery Address</h3>
                <div className="flex items-start">
                   <MapPin className="h-5 w-5 text-slate-400 mr-2 mt-0.5" />
                   <p className="text-slate-900">{order.delivery_address}</p>
                </div>
              </div>

              <div>
                 <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Restaurant</h3>
                 <p className="text-slate-900 font-medium">{order.restaurant?.restaurant_name}</p>
                 <p className="text-slate-500 text-sm">{order.restaurant?.address}</p>
              </div>

              {order.driver && (
                 <div className="bg-slate-50/60 p-4 rounded-lg border border-slate-100">
                    <h3 className="text-sm font-medium text-slate-900 mb-2">Driver Details</h3>
                    <div className="flex items-center">
                       <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                          <span className="text-slate-500 text-xs">IMG</span>
                       </div>
                       <div className="ml-3">
                          <p className="text-sm font-medium text-slate-900">Driver Assigned</p>
                          <p className="text-xs text-slate-500">{order.driver.vehicle_type} • {order.driver.vehicle_plate}</p>
                       </div>
                    </div>
                 </div>
              )}

              {/* Proof of Delivery */}
              {order.status === 'delivered' && order.proof_photo_url && (
                  <div className="mt-6 border-t border-slate-100 pt-6">
                      <h3 className="text-sm font-medium text-slate-900 mb-3">Proof of Delivery</h3>
                      <div className="rounded-lg overflow-hidden border border-slate-200">
                          <img src={order.proof_photo_url} alt="Proof of Delivery" className="w-full h-auto object-cover max-h-64" />
                          <div className="bg-slate-50 p-2 text-xs text-slate-500 flex items-center justify-between">
                              <span>Delivered</span>
                              {order.actual_delivery_lat && (
                                  <a 
                                    href={`https://www.google.com/maps/search/?api=1&query=${order.actual_delivery_lat},${order.actual_delivery_lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-orange-600 hover:underline flex items-center"
                                  >
                                      <MapPin className="w-3 h-3 mr-1" />
                                      View Location
                                  </a>
                              )}
                          </div>
                      </div>
                  </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
