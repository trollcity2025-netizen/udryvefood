'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Ban, AlertCircle, CheckCircle, DollarSign, History, ShieldAlert, Car, FileText, Check, X, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function AdminDriverDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params; // This is user_id

  const [driver, setDriver] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [updates, setUpdates] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [freezeReason, setFreezeReason] = useState('');
  const [showFreezeModal, setShowFreezeModal] = useState<'account' | 'payout' | null>(null);
  
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchDriver();
    fetchLogs();
    fetchUpdates();
  }, [id]);

  const fetchDriver = async () => {
    const { data, error } = await supabase
      .from('driver_profiles')
      .select(`
        *,
        user:user_id (
          email,
          full_name,
          phone_number,
          created_at
        )
      `)
      .eq('user_id', id)
      .single();
    
    if (data) setDriver(data);
    setLoading(false);
  };

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('audit_logs')
      .select(`
        *,
        admin:actor_admin_id (email)
      `)
      .eq('entity_id', id)
      .eq('entity_type', 'driver')
      .order('created_at', { ascending: false });
    
    if (data) setLogs(data);
  };

  const fetchUpdates = async () => {
    const { data } = await supabase
      .from('driver_document_updates')
      .select('*')
      .eq('driver_id', id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (data) setUpdates(data);
  };

  const handleFreeze = async () => {
    if (!freezeReason) return alert('Please provide a reason');
    setProcessing(true);
    
    try {
      if (showFreezeModal === 'account') {
        await supabase.rpc('admin_freeze_driver_account', {
          p_driver_id: id,
          p_reason: freezeReason
        });
      } else {
        await supabase.rpc('admin_freeze_driver_payout', {
          p_driver_id: id,
          p_reason: freezeReason
        });
      }
      
      setFreezeReason('');
      setShowFreezeModal(null);
      fetchDriver();
      fetchLogs();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleUnfreeze = async (type: 'account' | 'payout') => {
    if (!confirm(`Are you sure you want to unfreeze this ${type}?`)) return;
    setProcessing(true);
    
    try {
      if (type === 'account') {
        await supabase.rpc('admin_unfreeze_driver_account', { p_driver_id: id });
      } else {
        await supabase.rpc('admin_unfreeze_driver_payout', { p_driver_id: id });
      }
      
      fetchDriver();
      fetchLogs();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveUpdate = async (updateId: string) => {
    if (!confirm('Approve this document update?')) return;
    try {
        const { error } = await supabase.rpc('admin_approve_driver_document', { p_update_id: updateId });
        if (error) throw error;
        alert('Document approved');
        fetchUpdates();
        fetchDriver(); 
    } catch (err: any) {
        alert('Error: ' + err.message);
    }
  };

  const handleRejectUpdate = async () => {
    if (!rejectingId || !rejectReason) return;
    try {
        const { error } = await supabase
            .from('driver_document_updates')
            .update({ status: 'rejected', rejection_reason: rejectReason })
            .eq('id', rejectingId);
        
        if (error) throw error;
        
        setRejectingId(null);
        setRejectReason('');
        fetchUpdates();
    } catch (err: any) {
        alert('Error: ' + err.message);
    }
  };

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from('driver-documents').getPublicUrl(path);
    return data.publicUrl;
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!driver) return <div className="p-8 text-center">Driver not found</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Link href="/admin/drivers" className="flex items-center text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Drivers
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{driver.user?.full_name}</h1>
          <p className="text-slate-500">{driver.user?.email}</p>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-sm text-slate-500">
              Joined {format(new Date(driver.user?.created_at || new Date()), 'PPP')}
            </span>
            <span className="text-sm text-slate-500">
              Phone: {driver.user?.phone_number || driver.phone_number || 'N/A'}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-slate-900">${(driver.current_balance || 0).toFixed(2)}</div>
          <div className="text-sm text-slate-500">Current Balance</div>
        </div>
      </div>

      {/* Pending Document Updates */}
      {updates.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-orange-200 overflow-hidden">
            <div className="p-6 border-b border-orange-100 bg-orange-50">
                <h2 className="text-lg font-bold text-orange-900 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2 text-orange-600" />
                    Pending Document Reviews ({updates.length})
                </h2>
            </div>
            <div className="divide-y divide-slate-100">
                {updates.map((update) => (
                    <div key={update.id} className="p-6 flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 uppercase tracking-wide">
                                    {update.document_type.replace('_', ' ')}
                                </span>
                                <span className="text-xs text-slate-500">
                                    Uploaded {format(new Date(update.created_at), 'MMM d, h:mm a')}
                                </span>
                            </div>
                            
                            <div className="mt-4">
                                <a 
                                    href={getPublicUrl(update.document_url)} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    View Document
                                    <ExternalLink className="w-3 h-3 ml-1" />
                                </a>
                            </div>

                            {update.metadata && Object.keys(update.metadata).length > 0 && (
                                <div className="mt-3 text-sm text-slate-600">
                                    <span className="font-medium">Metadata:</span> {JSON.stringify(update.metadata)}
                                </div>
                            )}
                        </div>

                        <div className="flex items-start gap-3">
                            {rejectingId === update.id ? (
                                <div className="flex flex-col gap-2 w-full md:w-64">
                                    <textarea
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder="Reason for rejection..."
                                        className="text-sm rounded-lg border-slate-300 w-full"
                                        rows={2}
                                    />
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={handleRejectUpdate}
                                            className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 flex-1"
                                        >
                                            Confirm Reject
                                        </button>
                                        <button 
                                            onClick={() => { setRejectingId(null); setRejectReason(''); }}
                                            className="px-3 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium hover:bg-slate-200"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <button 
                                        onClick={() => handleApproveUpdate(update.id)}
                                        className="flex items-center px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200"
                                    >
                                        <Check className="w-4 h-4 mr-2" />
                                        Approve
                                    </button>
                                    <button 
                                        onClick={() => setRejectingId(update.id)}
                                        className="flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100"
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Reject
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center">
            <ShieldAlert className="w-5 h-5 mr-2 text-slate-400" />
            Account Status & Controls
          </h2>

          {/* Account Status */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
            <div>
              <div className="font-medium text-slate-900">Driver Account</div>
              <div className="text-sm text-slate-500">
                {driver.account_frozen ? 'Frozen (Blocked)' : 'Active'}
              </div>
            </div>
            {driver.account_frozen ? (
              <button
                onClick={() => handleUnfreeze('account')}
                disabled={processing}
                className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200"
              >
                Unfreeze Account
              </button>
            ) : (
              <button
                onClick={() => setShowFreezeModal('account')}
                disabled={processing}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
              >
                Freeze Account
              </button>
            )}
          </div>

          {/* Payout Status */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
            <div>
              <div className="font-medium text-slate-900">Payouts</div>
              <div className="text-sm text-slate-500">
                {driver.payout_frozen ? 'Frozen (No withdrawals)' : 'Active'}
              </div>
            </div>
            {driver.payout_frozen ? (
              <button
                onClick={() => handleUnfreeze('payout')}
                disabled={processing}
                className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200"
              >
                Unfreeze Payouts
              </button>
            ) : (
              <button
                onClick={() => setShowFreezeModal('payout')}
                disabled={processing}
                className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200"
              >
                Freeze Payouts
              </button>
            )}
          </div>

          {(driver.account_frozen || driver.payout_frozen) && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
              <h3 className="text-sm font-bold text-red-800 mb-1">Current Restrictions</h3>
              {driver.account_frozen && (
                <p className="text-sm text-red-700 mb-1">
                  • Account is frozen: Driver cannot login or accept orders.
                </p>
              )}
              {driver.payout_frozen && (
                <p className="text-sm text-red-700">
                  • Payouts are frozen: Driver cannot cash out earnings.
                </p>
              )}
              {driver.freeze_reason && (
                <div className="mt-2 pt-2 border-t border-red-100">
                  <span className="text-xs font-bold text-red-800">Reason: </span>
                  <span className="text-xs text-red-700">{driver.freeze_reason}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Vehicle Info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                <Car className="w-5 h-5 mr-2 text-slate-400" />
                Vehicle Details
            </h2>
            <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                    <dt className="text-slate-500">Vehicle</dt>
                    <dd className="font-medium">{driver.vehicle_year} {driver.vehicle_make} {driver.vehicle_model}</dd>
                </div>
                <div className="flex justify-between">
                    <dt className="text-slate-500">Color</dt>
                    <dd className="font-medium">{driver.vehicle_color}</dd>
                </div>
                <div className="flex justify-between">
                    <dt className="text-slate-500">License Plate</dt>
                    <dd className="font-medium">{driver.vehicle_plate}</dd>
                </div>
                <div className="pt-3 border-t border-slate-100">
                    <div className="flex justify-between">
                        <dt className="text-slate-500">License Number</dt>
                        <dd className="font-medium">{driver.driver_license_number}</dd>
                    </div>
                    <div className="flex justify-between mt-2">
                        <dt className="text-slate-500">State</dt>
                        <dd className="font-medium">{driver.license_state}</dd>
                    </div>
                </div>
            </dl>
        </div>
      </div>
      
       {/* Modal for Freeze Reason */}
      {showFreezeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Freeze {showFreezeModal === 'account' ? 'Driver Account' : 'Payouts'}
            </h3>
            <p className="text-slate-500 mb-4 text-sm">
              Please provide a reason for freezing this {showFreezeModal === 'account' ? 'account' : 'payout'}.
              This will be visible in the audit logs.
            </p>
            <textarea
              value={freezeReason}
              onChange={(e) => setFreezeReason(e.target.value)}
              className="w-full rounded-lg border-slate-300 mb-4"
              rows={3}
              placeholder="Reason for freezing..."
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowFreezeModal(null); setFreezeReason(''); }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleFreeze}
                disabled={!freezeReason}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Confirm Freeze
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit History */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
                <History className="w-5 h-5 mr-2 text-slate-400" />
                Action History
            </h2>
        </div>
        <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
                <tr>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Action</th>
                    <th className="px-6 py-3 font-medium">Admin</th>
                    <th className="px-6 py-3 font-medium">Reason</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                    <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                            No history recorded.
                        </td>
                    </tr>
                ) : (
                    logs.map((log) => (
                        <tr key={log.id}>
                            <td className="px-6 py-4 text-slate-500">
                                {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-900 capitalize">
                                {log.action.replace(/_/g, ' ')}
                            </td>
                            <td className="px-6 py-4 text-slate-500">
                                {log.admin?.email || 'System'}
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                                {log.reason || '-'}
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
}
