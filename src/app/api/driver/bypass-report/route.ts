import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const formData = await req.formData();
    const orderId = formData.get('orderId') as string | null;
    const reason = formData.get('reason') as string | null;
    const notes = formData.get('notes') as string | null;
    const latStr = formData.get('lat') as string | null;
    const lngStr = formData.get('lng') as string | null;
    const file = formData.get('file') as File | null;

    if (!orderId || !reason || !file) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select('driver_id')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.driver_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized for this order' }, { status: 403 });
    }

    const bucket = 'applications';
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `bypass-${orderId}-${Date.now()}.${fileExt}`;
    const path = `driver-bypass/${user.id}/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: file.type
      });

    if (uploadError) {
      return NextResponse.json({ error: 'Failed to upload media' }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    const mediaUrl = urlData.publicUrl;

    const lat = latStr ? Number(latStr) : null;
    const lng = lngStr ? Number(lngStr) : null;

    const { error: insertError } = await supabase.from('route_bypass_reports').insert({
      order_id: orderId,
      driver_id: user.id,
      reason,
      notes,
      media_url: mediaUrl,
      lat,
      lng
    });

    if (insertError) {
      return NextResponse.json({ error: 'Failed to save bypass report' }, { status: 500 });
    }

    await supabase.from('order_route_events').insert({
      order_id: orderId,
      driver_id: user.id,
      event_type: 'bypass_submitted',
      meta_json: { reason }
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unknown error' }, { status: 500 });
  }
}

