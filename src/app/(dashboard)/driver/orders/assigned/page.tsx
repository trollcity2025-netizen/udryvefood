'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState, useRef } from 'react';
import DriverMap from '@/components/maps';
import { MapPin, Clock, Navigation, CheckCircle, User, Camera, AlertTriangle, X, Loader2 } from 'lucide-react';

export default function AssignedOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [accountFrozen, setAccountFrozen] = useState(false);
  const [freezeReason, setFreezeReason] = useState<string | null>(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [proofPhoto, setProofPhoto] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [submittingProof, setSubmittingProof] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [routeOrder, setRouteOrder] = useState<any | null>(null);
  const [showOffRouteModal, setShowOffRouteModal] = useState(false);
  const [offRouteOrder, setOffRouteOrder] = useState<any | null>(null);
  const [bypassReason, setBypassReason] = useState('traffic');
  const [bypassNotes, setBypassNotes] = useState('');
  const [bypassFile, setBypassFile] = useState<File | null>(null);
  const [bypassFilePreview, setBypassFilePreview] = useState<string | null>(null);
  const [submittingBypass, setSubmittingBypass] = useState(false);
  const bypassFileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('assigned_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('driver_profiles')
        .select('account_frozen, freeze_reason')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setAccountFrozen(!!profile.account_frozen);
        setFreezeReason(profile.freeze_reason || null);
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          restaurant_profiles:restaurant_id (restaurant_name, address, latitude, longitude),
          users:customer_id (
              email
          )
        `)
        .eq('driver_id', user.id)
        .neq('status', 'delivered')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      console.error('Error fetching orders:', err.message || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const active = orders.find((o) => o.status === 'out_for_delivery');
    if (!active) {
      return;
    }
    if (!navigator.geolocation) {
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocation({ lat, lng });
        setLocationError(null);
        try {
          const res = await fetch('/api/driver/route-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: active.id, lat, lng })
          });
          const data = await res.json();
          if (data.status === 'off_route') {
            setOffRouteOrder(active);
            setShowOffRouteModal(true);
          }
        } catch (e) {
          console.error(e);
        }
      },
      (error) => {
        setLocationError('Unable to retrieve your location');
        console.error(error);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [orders]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    if (accountFrozen) {
      alert('Your account is currently frozen. Please contact support.');
      return;
    }
    if (newStatus === 'delivered') {
      const order = orders.find((o) => o.id === orderId);
      setSelectedOrder(order);
      setShowProofModal(true);
      setProofPhoto(null);
      setProofPreview(null);
      setLocation(null);
      setLocationError(null);
      getLocation();
      return;
    }

    setProcessingId(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      fetchOrders();
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationError(null);
      },
      (error) => {
        setLocationError('Unable to retrieve your location');
        console.error(error);
      }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProofPhoto(file);
      setProofPreview(URL.createObjectURL(file));
    }
  };

  const submitProofAndComplete = async () => {
    if (!selectedOrder || !proofPhoto || !location) return;

    setSubmittingProof(true);
    try {
      const fileExt = proofPhoto.name.split('.').pop();
      const fileName = `proof-${selectedOrder.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(`proofs/${filePath}`, proofPhoto);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl }
      } = supabase.storage.from('avatars').getPublicUrl(`proofs/${filePath}`);

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'delivered',
          proof_photo_url: publicUrl,
          actual_delivery_lat: location.lat,
          actual_delivery_lng: location.lng
        })
        .eq('id', selectedOrder.id);

      if (updateError) {
        const { error: fallbackError } = await supabase
          .from('orders')
          .update({ status: 'delivered' })
          .eq('id', selectedOrder.id);

        if (fallbackError) throw fallbackError;
        alert('Order marked delivered, but proof/location could not be saved.');
      }

      setShowProofModal(false);
      fetchOrders();
    } catch (error: any) {
      alert('Error completing delivery: ' + error.message);
    } finally {
      setSubmittingProof(false);
    }
  };

  const handleBypassFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBypassFile(file);
      setBypassFilePreview(URL.createObjectURL(file));
    }
  };

  const submitBypassReport = async () => {
    if (!offRouteOrder || !bypassFile || !location) return;
    setSubmittingBypass(true);
    try {
      const formData = new FormData();
      formData.append('orderId', offRouteOrder.id);
      formData.append('reason', bypassReason);
      if (bypassNotes) {
        formData.append('notes', bypassNotes);
      }
      formData.append('lat', String(location.lat));
      formData.append('lng', String(location.lng));
      formData.append('file', bypassFile);

      const res = await fetch('/api/driver/bypass-report', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit bypass report');
      }
      setShowOffRouteModal(false);
      setOffRouteOrder(null);
      setBypassFile(null);
      setBypassFilePreview(null);
      setBypassNotes('');
    } catch (e: any) {
      alert(e.message || 'Failed to submit bypass report');
    } finally {
      setSubmittingBypass(false);
    }
  };

  const openNavigation = (order: any) => {
    setRouteOrder(order);
    const pickupLat = order.restaurant_profiles?.latitude;
    const pickupLng = order.restaurant_profiles?.longitude;
    const dropLat = order.delivery_lat;
    const dropLng = order.delivery_lng;
    if (pickupLat && pickupLng && dropLat && dropLng) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${pickupLat},${pickupLng}&destination=${dropLat},${dropLng}&travelmode=driving`;
      window.open(url, '_blank');
    } else {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        order.delivery_address
      )}&travelmode=driving`;
      window.open(url, '_blank');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading orders...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {showProofModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-lg text-slate-900">Proof of Delivery</h3>
                      <button onClick={() => setShowProofModal(false)} className="text-slate-400 hover:text-slate-600">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto">
                      {/* Customer Verification */}
                      <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 mb-6">
                          <div className="flex items-start">
                              <AlertTriangle className="text-orange-600 w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
                              <div>
                                  <h4 className="font-semibold text-orange-900 text-sm">Verification Required</h4>
                                  <p className="text-sm text-orange-800 mt-1">
                                      Ensure the receiver matches this photo. Do NOT deliver if they do not match.
                                  </p>
                              </div>
                          </div>
                          <div className="mt-4 flex justify-center">
                              <div className="h-24 w-24 rounded-full border-4 border-white shadow-sm overflow-hidden bg-slate-200">
                                  {selectedOrder.users?.customer_profiles?.avatar_url ? (
                                      <img 
                                        src={selectedOrder.users.customer_profiles.avatar_url} 
                                        alt="Customer" 
                                        className="h-full w-full object-cover"
                                      />
                                  ) : (
                                      <div className="h-full w-full flex items-center justify-center text-slate-400">
                                          <User size={40} />
                                      </div>
                                  )}
                              </div>
                          </div>
                          <p className="text-center text-xs text-orange-700 mt-2 font-medium">
                              {selectedOrder.users?.email}
                          </p>
                      </div>

                      {/* Photo Upload */}
                      <div className="mb-6">
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                              Take Delivery Photo
                          </label>
                          <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors bg-slate-50"
                          >
                              {proofPreview ? (
                                  <img src={proofPreview} alt="Proof" className="max-h-48 rounded shadow-sm" />
                              ) : (
                                  <>
                                      <Camera className="w-8 h-8 text-slate-400 mb-2" />
                                      <span className="text-sm text-slate-500">Tap to take photo</span>
                                  </>
                              )}
                          </div>
                          <input 
                              type="file" 
                              accept="image/*" 
                              capture="environment"
                              ref={fileInputRef} 
                              onChange={handleFileChange} 
                              className="hidden" 
                          />
                      </div>

                      {/* Location Status */}
                      <div className="flex items-center justify-between text-sm bg-slate-50 p-3 rounded-lg">
                          <span className="text-slate-600 flex items-center">
                              <MapPin className="w-4 h-4 mr-2" />
                              Location
                          </span>
                          {location ? (
                              <span className="text-emerald-600 font-medium flex items-center">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Acquired
                              </span>
                          ) : locationError ? (
                              <span className="text-red-600">{locationError}</span>
                          ) : (
                              <span className="text-slate-400 flex items-center">
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  Locating...
                              </span>
                          )}
                      </div>
                  </div>

                  <div className="p-4 border-t border-slate-100 bg-slate-50">
                      <button 
                          onClick={submitProofAndComplete}
                          disabled={!proofPhoto || !location || submittingProof}
                          className="w-full bg-emerald-600 text-white font-medium py-3 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                          {submittingProof ? (
                              <>
                                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                  Uploading...
                              </>
                          ) : (
                              'Confirm Delivery'
                          )}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {showOffRouteModal && offRouteOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-900">Off Route Detected</h3>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex">
                <AlertTriangle className="text-red-600 w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-900 text-sm">You are off the recommended route.</p>
                  <p className="text-sm text-red-800 mt-1">
                    Submit a bypass report explaining why you left the route.
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Reason</label>
                <select
                  value={bypassReason}
                  onChange={(e) => setBypassReason(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="traffic">Traffic</option>
                  <option value="road_block">Road block</option>
                  <option value="accident">Accident</option>
                  <option value="police">Police</option>
                  <option value="closed_road">Closed road</option>
                  <option value="safety_issue">Safety issue</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                <textarea
                  value={bypassNotes}
                  onChange={(e) => setBypassNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[80px]"
                  placeholder="Add any extra context for support review"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Upload photo</label>
                <div
                  onClick={() => bypassFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors bg-slate-50"
                >
                  {bypassFilePreview ? (
                    <img src={bypassFilePreview} alt="Bypass" className="max-h-48 rounded shadow-sm" />
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-sm text-slate-500">Tap to upload photo</span>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={bypassFileInputRef}
                  onChange={handleBypassFileChange}
                  className="hidden"
                />
              </div>
              <div className="flex items-center justify-between text-sm bg-slate-50 p-3 rounded-lg">
                <span className="text-slate-600 flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  Location
                </span>
                {location ? (
                  <span className="text-emerald-600 font-medium flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Acquired
                  </span>
                ) : locationError ? (
                  <span className="text-red-600">{locationError}</span>
                ) : (
                  <span className="text-slate-400 flex items-center">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Locating...
                  </span>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={submitBypassReport}
                disabled={!bypassFile || !location || submittingBypass}
                className="w-full bg-emerald-600 text-white font-medium py-3 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {submittingBypass ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Bypass Report'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Assigned Orders</h1>
        <p className="text-slate-500">Manage your active deliveries.</p>
      </div>

      {accountFrozen && (
        <div className="mb-6 bg-red-50 border border-red-100 rounded-lg p-4 text-sm text-red-800">
          Your driver account is currently frozen. You cannot start or complete deliveries.
          {freezeReason && <span className="block mt-1 text-red-700">Reason: {freezeReason}</span>}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-slate-200">
            <div className="mx-auto h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-4">
                <Navigation size={32} />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No active deliveries</h3>
            <p className="text-slate-500 mt-1">Accept orders from the Available Orders page.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 flex flex-col md:flex-row md:items-start justify-between gap-6">
                
                {/* Order Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                     <div>
                        <h3 className="font-bold text-xl text-slate-900">{order.restaurant_profiles?.restaurant_name}</h3>
                        <p className="text-sm text-slate-500">Order #{order.id.slice(0, 8)}</p>
                     </div>
                     <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                        ${order.status === 'out_for_delivery' ? 'bg-orange-100 text-orange-800' : 
                          order.status === 'ready' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                        {order.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                      <div>
                        <div className="flex items-start mb-1">
                            <MapPin className="w-4 h-4 text-slate-400 mr-2 mt-1" />
                            <p className="text-sm font-medium text-slate-900">Pickup</p>
                        </div>
                        <p className="text-sm text-slate-600 ml-6">{order.restaurant_profiles?.address}</p>
                      </div>
                      <div>
                        <div className="flex items-start mb-1">
                            <MapPin className="w-4 h-4 text-emerald-500 mr-2 mt-1" />
                            <p className="text-sm font-medium text-slate-900">Dropoff</p>
                        </div>
                        <p className="text-sm text-slate-600 ml-6">{order.delivery_address}</p>
                        <p className="text-xs text-slate-400 ml-6 mt-1">Customer: {order.users?.email}</p>
                      </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 w-full md:w-48">
                    <button
                      className="w-full bg-white border border-slate-200 text-slate-700 font-medium py-2 rounded-lg hover:bg-slate-50 transition flex items-center justify-center"
                      onClick={() => openNavigation(order)}
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Navigate
                    </button>
                    
                    {order.status === 'ready' && (
                      <button
                        onClick={() => updateStatus(order.id, 'out_for_delivery')}
                        disabled={processingId === order.id || accountFrozen}
                        className="w-full bg-orange-600 text-white font-medium py-2 rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
                      >
                        {processingId === order.id ? 'Updating...' : 'Start Delivery'}
                      </button>
                    )}

                    {order.status === 'out_for_delivery' && (
                      <button
                        onClick={() => updateStatus(order.id, 'delivered')}
                        disabled={processingId === order.id || !!offRouteOrder || accountFrozen}
                        className="w-full bg-emerald-600 text-white font-medium py-2 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {processingId === order.id ? 'Completing...' : 'Complete'}
                      </button>
                    )}
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {routeOrder && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="font-bold text-slate-900">Route Map</h2>
              <p className="text-xs text-slate-500">Recommended route for this delivery</p>
            </div>
            <span className="text-xs text-slate-500">Order #{routeOrder.id.slice(0, 8)}</span>
          </div>
          <div className="h-[300px] w-full">
            <DriverMap
              driverLat={location?.lat}
              driverLng={location?.lng}
              pickupLat={routeOrder.restaurant_profiles?.latitude}
              pickupLng={routeOrder.restaurant_profiles?.longitude}
              dropoffLat={routeOrder.delivery_lat}
              dropoffLng={routeOrder.delivery_lng}
            />
          </div>
        </div>
      )}
    </div>
  );
}
