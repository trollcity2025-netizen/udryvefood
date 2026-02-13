import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

async function getGoogleRoute(originLat: number, originLng: number, destLat: number, destLng: number) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const isMock = !apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY';

  if (isMock) {
    // Return mock route data
    const mockMiles = 3.5;
    return {
      miles: mockMiles,
      roundedMiles: 3.5,
      polyline: 'mock_polyline_data'
    };
  }

  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY is not configured');
  }
  const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
  url.searchParams.set('origin', `${originLat},${originLng}`);
  url.searchParams.set('destination', `${destLat},${destLng}`);
  url.searchParams.set('mode', 'driving');
  url.searchParams.set('key', apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error('Failed to fetch route from Google');
  }
  const data = await res.json();
  if (!data.routes || !data.routes[0] || !data.routes[0].legs || !data.routes[0].legs[0]) {
    throw new Error('No route found');
  }
  const leg = data.routes[0].legs[0];
  const meters = leg.distance.value as number;
  const miles = meters / 1609.34;
  const roundedMiles = Math.ceil(miles * 10) / 10;
  const polyline = data.routes[0].overview_polyline?.points as string | undefined;

  return {
    miles,
    roundedMiles,
    polyline
  };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      items,
      address,
      tipAmount,
      paypalOrderId
    } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items in order' }, { status: 400 });
    }

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const foodSubtotal = items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );

    const tip = Number(tipAmount || 0);

    const baseDeliveryFee = foodSubtotal * 0.05;
    const serviceFee = foodSubtotal * 0.1;
    const tax = foodSubtotal * 0.08;

    const restaurantId = items[0].restaurantId as string;

    const { data: restaurantProfile, error: restaurantError } = await supabase
      .from('restaurant_profiles')
      .select('latitude, longitude')
      .eq('user_id', restaurantId)
      .single();

    if (restaurantError || !restaurantProfile) {
      return NextResponse.json({ error: 'Restaurant location not found' }, { status: 400 });
    }

    const { data: customerProfile, error: customerError } = await supabase
      .from('customer_profiles')
      .select('default_lat, default_lng')
      .eq('user_id', user.id)
      .single();

    if (customerError || !customerProfile || customerProfile.default_lat == null || customerProfile.default_lng == null) {
      return NextResponse.json({ error: 'Customer location not found' }, { status: 400 });
    }

    const route = await getGoogleRoute(
      restaurantProfile.latitude,
      restaurantProfile.longitude,
      customerProfile.default_lat,
      customerProfile.default_lng
    );

    const distanceFee = route.roundedMiles * 0.5;
    const deliveryFee = baseDeliveryFee + distanceFee;

    const restaurantShare = foodSubtotal * 0.7;
    const driverBaseShare = foodSubtotal * 0.2;
    const platformBaseShare = foodSubtotal * 0.1;

    const createdAt = new Date();
    const dow = createdAt.getDay();
    const isWeekend = dow === 0 || dow === 5 || dow === 6;
    const driverBonus = isWeekend ? 1 : 0.5;

    const restaurantPayout = restaurantShare;
    const driverPayout = driverBaseShare + deliveryFee + tip + driverBonus;
    const platformRevenue = platformBaseShare + (serviceFee - driverBonus);

    const grandTotal = foodSubtotal + deliveryFee + serviceFee + tax + tip;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: user.id,
        restaurant_id: restaurantId,
        total_amount: grandTotal,
        status: 'pending',
        delivery_address: address,
        delivery_lat: customerProfile.default_lat,
        delivery_lng: customerProfile.default_lng,
        food_subtotal: foodSubtotal,
        base_delivery_fee: baseDeliveryFee,
        distance_fee: distanceFee,
        delivery_fee: deliveryFee,
        service_fee: serviceFee,
        tips: tip,
        tax: tax,
        driver_bonus: driverBonus,
        restaurant_payout: restaurantPayout,
        driver_payout: driverPayout,
        platform_revenue: platformRevenue,
        delivery_distance_miles: route.miles,
        delivery_distance_miles_rounded: route.roundedMiles,
        route_polyline: route.polyline,
        route_provider: 'google',
        route_calculated_at: createdAt.toISOString()
      })
      .select()
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      menu_item_id: item.id,
      quantity: item.quantity,
      price_at_time: item.price,
      notes: item.notes
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) {
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 });
    }

    if (paypalOrderId) {
      const { error: paymentError } = await supabase.from('payments').insert({
        order_id: order.id,
        paypal_order_id: paypalOrderId,
        amount: grandTotal,
        status: 'completed'
      });
      if (paymentError) {
        return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
      }
    }

    return NextResponse.json({ orderId: order.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}

