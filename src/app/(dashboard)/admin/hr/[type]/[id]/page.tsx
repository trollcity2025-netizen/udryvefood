'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Check, X, AlertTriangle, Download, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function ApplicationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { type, id } = params;
  
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const table = type === 'driver' ? 'driver_applications' : 'restaurant_applications';
        const { data, error } = await supabase
          .from(table)
          .select('*, user:user_id(email)')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        setApplication(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (type && id) {
      fetchApplication();
    }
  }, [type, id]);

  const updateStatus = async (newStatus: 'approved' | 'rejected' | 'changes_requested', reason?: string) => {
    setProcessing(true);
    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      if (!adminUser) throw new Error('Not authenticated');

      const table = type === 'driver' ? 'driver_applications' : 'restaurant_applications';

      // 1. Update Application
      const updateData: any = {
        status: newStatus,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminUser.id
      };

      if (reason) {
        if (newStatus === 'rejected') {
          updateData.rejection_reason = reason;
        } else if (newStatus === 'changes_requested') {
          updateData.admin_notes = reason;
        }
      }

      const { error: appError } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', id);

      if (appError) throw appError;

      // 2. Update User Status
      // For changes_requested, we also update user status so they see the correct screen
      const { error: userError } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', application.user_id);

      if (userError) throw userError;

      // 3. Audit Log
      await supabase.from('application_audit_logs').insert({
        application_type: type,
        application_id: id,
        actor_id: adminUser.id,
        old_status: application.status,
        new_status: newStatus,
        reason: reason || `Admin action: ${newStatus}`
      });

      router.push('/admin/hr');
      router.refresh();

    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setProcessing(false);
      setShowRejectModal(false);
    }
  };

  if (loading) return <div className="p-12 text-center">Loading...</div>;
  if (error) return <div className="p-12 text-center text-red-500">Error: {error}</div>;
  if (!application) return <div className="p-12 text-center">Application not found</div>;

  const isDriver = type === 'driver';

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Link href="/admin/hr" className="flex items-center text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Applications
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                {isDriver ? application.legal_name : application.restaurant_name}
              </h1>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                application.status === 'approved' ? 'bg-green-100 text-green-800' :
                application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                application.status === 'changes_requested' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {application.status.toUpperCase()}
              </span>
            </div>
            <p className="text-slate-500 mt-1">
              {isDriver ? 'Driver Application' : 'Restaurant Application'} • ID: {application.id.slice(0, 8)}
            </p>
            <p className="text-slate-500 text-sm">
                Submitted on {format(new Date(application.submitted_at || application.created_at), 'PPP p')}
            </p>
          </div>
          
          <div className="flex gap-2">
            {application.status !== 'approved' && (
                <button
                onClick={() => updateStatus('approved')}
                disabled={processing}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                <Check className="w-4 h-4 mr-2" />
                Approve
                </button>
            )}
            
            {application.status !== 'rejected' && (
                 <button
                 onClick={() => setShowRejectModal(true)}
                 disabled={processing}
                 className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                 >
                 <X className="w-4 h-4 mr-2" />
                 Reject
                 </button>
            )}

            {application.status !== 'under_review' && application.status !== 'approved' && application.status !== 'rejected' && (
                 <button
                 onClick={() => {
                     const reason = prompt('Enter note for user (optional):');
                     if (reason !== null) updateStatus('changes_requested', reason);
                 }}
                 disabled={processing}
                 className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
                 >
                 <AlertTriangle className="w-4 h-4 mr-2" />
                 Request Changes
                 </button>
            )}
          </div>
        </div>

        {/* Content Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main Details */}
          <div className="md:col-span-2 space-y-8">
            <section>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-slate-500">Email</dt>
                  <dd className="font-medium text-slate-900">{application.email}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Phone</dt>
                  <dd className="font-medium text-slate-900">{application.phone}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-slate-500">Address</dt>
                  <dd className="font-medium text-slate-900">{application.address}</dd>
                </div>
                {isDriver && (
                    <>
                        <div>
                            <dt className="text-slate-500">Date of Birth</dt>
                            <dd className="font-medium text-slate-900">{application.dob}</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">Payout Email</dt>
                            <dd className="font-medium text-slate-900">{application.payout_email}</dd>
                        </div>
                    </>
                )}
                 {!isDriver && (
                    <>
                        <div>
                            <dt className="text-slate-500">Owner Name</dt>
                            <dd className="font-medium text-slate-900">{application.owner_name}</dd>
                        </div>
                         <div>
                            <dt className="text-slate-500">Payout Email</dt>
                            <dd className="font-medium text-slate-900">{application.payout_email}</dd>
                        </div>
                    </>
                )}
              </dl>
            </section>

            {isDriver ? (
                <>
                    <section>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Vehicle Information</h3>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                        <dt className="text-slate-500">Vehicle</dt>
                        <dd className="font-medium text-slate-900">{application.vehicle_year} {application.vehicle_make} {application.vehicle_model}</dd>
                        </div>
                        <div>
                        <dt className="text-slate-500">Color</dt>
                        <dd className="font-medium text-slate-900">{application.vehicle_color}</dd>
                        </div>
                        <div>
                        <dt className="text-slate-500">License Plate</dt>
                        <dd className="font-medium text-slate-900">{application.vehicle_plate}</dd>
                        </div>
                    </dl>
                    </section>

                    <section>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">License & Insurance</h3>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                        <dt className="text-slate-500">License Number</dt>
                        <dd className="font-medium text-slate-900">{application.driver_license_number}</dd>
                        </div>
                        <div>
                        <dt className="text-slate-500">State</dt>
                        <dd className="font-medium text-slate-900">{application.license_state}</dd>
                        </div>
                        <div>
                        <dt className="text-slate-500">Expiration</dt>
                        <dd className="font-medium text-slate-900">{application.driver_license_expiration}</dd>
                        </div>
                         <div>
                        <dt className="text-slate-500">Insurance Provider</dt>
                        <dd className="font-medium text-slate-900">{application.insurance_provider}</dd>
                        </div>
                    </dl>
                    </section>
                </>
            ) : (
                <section>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Business Details</h3>
                   <dl className="grid grid-cols-1 gap-4 text-sm">
                        <div>
                        <dt className="text-slate-500">Cuisine Categories</dt>
                        <dd className="font-medium text-slate-900">{application.cuisine_categories?.join(', ')}</dd>
                        </div>
                        <div>
                        <dt className="text-slate-500">Operating Hours</dt>
                        <dd className="font-medium text-slate-900 whitespace-pre-line">{application.operating_hours}</dd>
                        </div>
                        <div>
                        <dt className="text-slate-500">Menu Ready?</dt>
                        <dd className="font-medium text-slate-900">{application.is_menu_ready ? 'Yes' : 'No'}</dd>
                        </div>
                        {application.menu_notes && (
                            <div>
                            <dt className="text-slate-500">Menu Notes</dt>
                            <dd className="font-medium text-slate-900">{application.menu_notes}</dd>
                            </div>
                        )}
                   </dl>
                </section>
            )}
          </div>

          {/* Sidebar / Documents */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">Documents & Photos</h3>
            
            {isDriver ? (
                <div className="space-y-4">
                    <DocumentPreview label="Profile Photo" path={application.profile_photo_url} bucket="avatars" />
                    <DocumentPreview label="ID Front" path={application.id_front_url} bucket="driver-documents" />
                    <DocumentPreview label="ID Back" path={application.id_back_url} bucket="driver-documents" />
                </div>
            ) : (
                <div className="space-y-4">
                    <DocumentPreview label="Logo" path={application.logo_url} bucket="applications" />
                    <DocumentPreview label="Cover Photo" path={application.cover_photo_url} bucket="applications" />
                    <DocumentPreview label="Business License" path={application.business_license_url} bucket="applications" />
                    <DocumentPreview label="Food Handler Permit" path={application.food_handler_permit_url} bucket="applications" />
                </div>
            )}

             {application.rejection_reason && (
                <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-100">
                    <h4 className="text-sm font-semibold text-red-800 mb-1">Rejection Reason</h4>
                    <p className="text-sm text-red-700">{application.rejection_reason}</p>
                </div>
            )}
            {application.admin_notes && (
                <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                    <h4 className="text-sm font-semibold text-yellow-800 mb-1">Admin Notes / Feedback</h4>
                    <p className="text-sm text-yellow-700">{application.admin_notes}</p>
                </div>
            )}
          </div>

        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
                <h3 className="text-lg font-bold mb-4">Reject Application</h3>
                <textarea
                    className="w-full border border-slate-300 rounded-md p-2 h-32 mb-4"
                    placeholder="Reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                    <button 
                        onClick={() => setShowRejectModal(false)}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => updateStatus('rejected', rejectionReason)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                        Confirm Rejection
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

function DocumentPreview({ label, path, bucket }: { label: string, path: string, bucket: string }) {
    const [url, setUrl] = useState('');
    const supabase = createClient();

    useEffect(() => {
        if (!path) return;
        
        if (path.startsWith('http')) {
            setUrl(path);
            return;
        }

        if (bucket === 'avatars') {
            const { data } = supabase.storage.from(bucket).getPublicUrl(path);
            setUrl(data.publicUrl);
        } else {
            // Private bucket - get signed URL for 1 hour
            supabase.storage.from(bucket).createSignedUrl(path, 3600).then(({ data, error }) => {
                if (data) setUrl(data.signedUrl);
                else console.error(`Error signing URL for ${label}:`, error);
            });
        }
    }, [path, bucket, label]);

    if (!path) return null;
    
    if (!url) {
        return (
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin" />
                <span className="text-xs font-medium text-slate-500 uppercase">Loading {label}...</span>
            </div>
        );
    }
    
    return (
        <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-slate-500 uppercase">{label}</span>
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                    <ExternalLink className="w-4 h-4" />
                </a>
            </div>
            {/* Try to show image preview if it's an image */}
            <div className="aspect-video bg-slate-200 rounded overflow-hidden relative group">
                <img src={url} alt={label} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="bg-white p-2 rounded-full shadow-lg">
                        <Download className="w-4 h-4 text-slate-700" />
                    </a>
                </div>
            </div>
        </div>
    );
}
