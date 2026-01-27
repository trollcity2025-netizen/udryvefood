'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Filter, ChevronDown, AlertTriangle, MapPin, CreditCard } from 'lucide-react';
import DriverMap from '@/components/maps';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [driverProfile, setDriverProfile] = useState<any | null>(null);
  const supabase = createClient();

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        users:customer_id(email),
        restaurant_profiles:restaurant_id(restaurant_name, latitude, longitude),
        route_bypass_reports(*),
        order_route_events(*),
        refunds(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
    }

    if (data) {
      setOrders(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const loadDriverProfile = async () => {
      if (!selectedOrder || !selectedOrder.driver_id) {
        setDriverProfile(null);
        return;
      }
      const { data } = await supabase
        .from('driver_profiles')
        .select('user_id, payout_frozen, account_frozen, freeze_reason')
        .eq('user_id', selectedOrder.driver_id)
        .single();
      setDriverProfile(data || null);
    };
    loadDriverProfile();
  }, [selectedOrder]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border border-red-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'preparing':
        return 'bg-sky-50 text-sky-700 border border-sky-200';
      case 'out_for_delivery':
        return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  };

  const handleHoldPayout = async (order: any) => {
    const reason = window.prompt('Reason for payout hold?');
    if (!reason) return;
    const { error } = await supabase.rpc('admin_hold_payout', {
      p_order_id: order.id,
      p_reason: reason
    });
    if (error) {
      alert(error.message);
      return;
    }
    fetchOrders();
  };

  const handleReleaseHold = async (order: any) => {
    const { error } = await supabase.rpc('admin_release_payout_hold', {
      p_order_id: order.id
    });
    if (error) {
      alert(error.message);
      return;
    }
    fetchOrders();
  };

  const handleFreezePayouts = async (order: any) => {
    if (!order.driver_id) return;
    const reason = window.prompt('Reason for freezing driver payouts?');
    if (!reason) return;
    const { error } = await supabase.rpc('admin_freeze_driver_payout', {
      p_driver_id: order.driver_id,
      p_reason: reason
    });
    if (error) {
      alert(error.message);
      return;
    }
    fetchOrders();
  };

  const handleUnfreezePayouts = async (order: any) => {
    if (!order.driver_id) return;
    const { error } = await supabase.rpc('admin_unfreeze_driver_payout', {
      p_driver_id: order.driver_id
    });
    if (error) {
      alert(error.message);
      return;
    }
    fetchOrders();
  };

  const handleFreezeAccount = async (order: any) => {
    if (!order.driver_id) return;
    const reason = window.prompt('Reason for freezing driver account?');
    if (!reason) return;
    const { error } = await supabase.rpc('admin_freeze_driver_account', {
      p_driver_id: order.driver_id,
      p_reason: reason
    });
    if (error) {
      alert(error.message);
      return;
    }
    fetchOrders();
  };

  const handleUnfreezeAccount = async (order: any) => {
    if (!order.driver_id) return;
    const { error } = await supabase.rpc('admin_unfreeze_driver_account', {
      p_driver_id: order.driver_id
    });
    if (error) {
      alert(error.message);
      return;
    }
    fetchOrders();
  };

  const handleRefund = async (order: any) => {
    const amountStr = window.prompt('Refund amount?');
    if (!amountStr) return;
    const amount = Number(amountStr);
    if (!amount || amount <= 0) return;
    const reason = window.prompt('Reason for refund?') || '';
    const ref = window.prompt('Processor reference (optional)') || '';
    const { error } = await supabase.rpc('admin_refund_order', {
      p_order_id: order.id,
      p_amount: amount,
      p_reason: reason,
      p_processor_ref: ref
    });
    if (error) {
      alert(error.message);
      return;
    }
    fetchOrders();
  };

  const hasOffRoute = (order: any) =>
    Array.isArray(order.order_route_events) &&
    order.order_route_events.some((e: any) => e.event_type === 'off_route');

  const hasBypass = (order: any) =>
    Array.isArray(order.route_bypass_reports) && order.route_bypass_reports.length > 0;

  const latestRefundStatus = (order: any) => {
    if (!Array.isArray(order.refunds) || order.refunds.length === 0) return null;
    const sorted = [...order.refunds].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return sorted[0].status;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">All Orders</h1>
        <div className="flex space-x-3">
          <button className="flex items-center px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </button>
          <button className="flex items-center px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors">
            <span>Status: All</span>
            <ChevronDown className="ml-2 h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Restaurant
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Flags
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-4 text-center text-slate-500"
                  >
                    Loading orders...
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/60 cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      #{order.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {order.users?.email || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {order.restaurant_profiles?.restaurant_name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
                      ${order.total_amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      <div className="flex flex-wrap gap-1">
                        {order.payout_hold && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            Payout hold
                          </span>
                        )}
                        {hasOffRoute(order) && (
                          <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Off route
                          </span>
                        )}
                        {hasBypass(order) && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200">
                            Bypass report
                          </span>
                        )}
                        {latestRefundStatus(order) && (
                          <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 flex items-center">
                            <CreditCard className="w-3 h-3 mr-1" />
                            Refund {latestRefundStatus(order)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-start justify-end">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Order #{selectedOrder.id.slice(0, 8)}
                </h2>
                <p className="text-xs text-slate-500">
                  {selectedOrder.users?.email} ·{' '}
                  {selectedOrder.restaurant_profiles?.restaurant_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-sm text-slate-500 hover:text-slate-800"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Total amount</p>
                  <p className="text-base font-semibold text-slate-900">
                    ${selectedOrder.total_amount}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Status</p>
                  <p className="text-base font-semibold text-slate-900">
                    {selectedOrder.status.replace(/_/g, ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Payout hold</p>
                  <p className="text-base font-semibold text-slate-900">
                    {selectedOrder.payout_hold ? 'Yes' : 'No'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Created</p>
                  <p className="text-base font-semibold text-slate-900">
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="h-56 w-full rounded-lg border border-slate-200 overflow-hidden">
                <DriverMap
                  driverLat={undefined}
                  driverLng={undefined}
                  pickupLat={selectedOrder.restaurant_profiles?.latitude}
                  pickupLng={selectedOrder.restaurant_profiles?.longitude}
                  dropoffLat={selectedOrder.delivery_lat}
                  dropoffLng={selectedOrder.delivery_lng}
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">
                  Route events
                </h3>
                {Array.isArray(selectedOrder.order_route_events) &&
                selectedOrder.order_route_events.length > 0 ? (
                  <ul className="space-y-2 text-xs">
                    {[...selectedOrder.order_route_events]
                      .sort(
                        (a, b) =>
                          new Date(a.created_at).getTime() -
                          new Date(b.created_at).getTime()
                      )
                      .map((event: any) => (
                        <li
                          key={event.id}
                          className="flex items-start gap-2 border border-slate-100 rounded-lg px-3 py-2"
                        >
                          <AlertTriangle className="w-3 h-3 mt-0.5 text-slate-400" />
                          <div>
                            <p className="font-medium text-slate-800">
                              {event.event_type.replace(/_/g, ' ')}
                            </p>
                            <p className="text-slate-500">
                              {new Date(event.created_at).toLocaleString()}
                            </p>
                          </div>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500">
                    No route events recorded.
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">
                  Bypass reports
                </h3>
                {Array.isArray(selectedOrder.route_bypass_reports) &&
                selectedOrder.route_bypass_reports.length > 0 ? (
                  <div className="space-y-3">
                    {selectedOrder.route_bypass_reports.map((report: any) => (
                      <div
                        key={report.id}
                        className="border border-slate-100 rounded-lg p-3 text-xs space-y-2"
                      >
                        <p className="font-medium text-slate-800">
                          Reason: {report.reason}
                        </p>
                        {report.notes && (
                          <p className="text-slate-600">{report.notes}</p>
                        )}
                        <p className="text-slate-500">
                          {new Date(report.created_at).toLocaleString()}
                        </p>
                        {report.media_url && (
                          <img
                            src={report.media_url}
                            alt="Bypass media"
                            className="mt-2 max-h-40 rounded"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    No bypass reports submitted.
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">
                  Driver controls
                </h3>
                {selectedOrder.driver_id ? (
                  <div className="space-y-2 text-xs">
                    <p className="text-slate-500">
                      Driver ID: {selectedOrder.driver_id}
                    </p>
                    {driverProfile && (
                      <p className="text-slate-500">
                        Payout frozen:{' '}
                        {driverProfile.payout_frozen ? 'Yes' : 'No'} · Account
                        frozen:{' '}
                        {driverProfile.account_frozen ? 'Yes' : 'No'}
                        {driverProfile.freeze_reason &&
                          ` · Reason: ${driverProfile.freeze_reason}`}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedOrder.payout_hold ? (
                        <button
                          onClick={() => handleReleaseHold(selectedOrder)}
                          className="px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                        >
                          Release payout hold
                        </button>
                      ) : (
                        <button
                          onClick={() => handleHoldPayout(selectedOrder)}
                          className="px-3 py-1.5 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200"
                        >
                          Hold payout
                        </button>
                      )}
                      {driverProfile && driverProfile.payout_frozen ? (
                        <button
                          onClick={() => handleUnfreezePayouts(selectedOrder)}
                          className="px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                        >
                          Unfreeze payouts
                        </button>
                      ) : (
                        <button
                          onClick={() => handleFreezePayouts(selectedOrder)}
                          className="px-3 py-1.5 rounded-md text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200"
                        >
                          Freeze payouts
                        </button>
                      )}
                      {driverProfile && driverProfile.account_frozen ? (
                        <button
                          onClick={() => handleUnfreezeAccount(selectedOrder)}
                          className="px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                        >
                          Unfreeze account
                        </button>
                      ) : (
                        <button
                          onClick={() => handleFreezeAccount(selectedOrder)}
                          className="px-3 py-1.5 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200"
                        >
                          Freeze account
                        </button>
                      )}
                      <button
                        onClick={() => handleRefund(selectedOrder)}
                        className="px-3 py-1.5 rounded-md text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200"
                      >
                        Refund customer
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    No driver assigned to this order.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
