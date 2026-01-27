import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

function decodePolyline(str: string): Array<[number, number]> {
  let index = 0, lat = 0, lng = 0;
  const coordinates: Array<[number, number]> = [];
  while (index < str.length) {
    let b, shift = 0, result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;
    coordinates.push([lat / 1e5, lng / 1e5]);
  }
  return coordinates;
}

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (x: number) => x * Math.PI / 180;
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function distanceToPolylineMiles(lat: number, lng: number, polyline: Array<[number, number]>) {
  let min = Infinity;
  for (const [plat, plng] of polyline) {
    const d = haversineMiles(lat, lng, plat, plng);
    if (d < min) min = d;
  }
  return min;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { orderId, lat, lng } = await req.json();
    if (!orderId || typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const { data: order, error } = await supabase
      .from('orders')
      .select('driver_id, route_polyline')
      .eq('id', orderId)
      .single();
    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (order.driver_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized for this order' }, { status: 403 });
    }
    if (!order.route_polyline) {
      return NextResponse.json({ status: 'no_route' });
    }
    const poly = decodePolyline(order.route_polyline);
    const offRouteDistance = distanceToPolylineMiles(lat, lng, poly);
    const thresholdMiles = 0.3;
    if (offRouteDistance > thresholdMiles) {
      await supabase.from('order_route_events').insert({
        order_id: orderId,
        driver_id: user.id,
        event_type: 'off_route',
        meta_json: { off_route_distance_miles: offRouteDistance, lat, lng }
      });
      return NextResponse.json({ status: 'off_route', offRouteDistance });
    } else {
      await supabase.from('order_route_events').insert({
        order_id: orderId,
        driver_id: user.id,
        event_type: 'on_route',
        meta_json: { lat, lng }
      });
      return NextResponse.json({ status: 'on_route' });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unknown error' }, { status: 500 });
  }
}

