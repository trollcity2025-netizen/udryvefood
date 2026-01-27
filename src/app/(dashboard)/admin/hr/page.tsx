'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { format } from 'date-fns';
import { Check, X, Eye, FileText, Truck, Store, Search, Filter, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminHRPage() {
  const [activeTab, setActiveTab] = useState<'driver' | 'restaurant'>('driver');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const supabase = createClient();
  const router = useRouter();

  const fetchApplications = async () => {
    setLoading(true);
    setError('');
    
    try {
      const table = activeTab === 'driver' ? 'driver_applications' : 'restaurant_applications';
      
      let query = supabase
        .from(table)
        .select(`
          *,
          user:user_id (email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setApplications(data || []);
    } catch (err: any) {
      console.error('Error fetching applications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [activeTab, statusFilter]);

  const updateStatus = async (id: string, newStatus: 'approved' | 'rejected', userId: string) => {
    if (!confirm(`Are you sure you want to ${newStatus} this application?`)) return;
    
    setProcessingId(id);
    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      if (!adminUser) throw new Error('Not authenticated');

      const table = activeTab === 'driver' ? 'driver_applications' : 'restaurant_applications';

      // 1. Update Application Status
      const { error: appError } = await supabase
        .from(table)
        .update({
          status: newStatus,
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminUser.id
        })
        .eq('id', id);

      if (appError) throw appError;

      // 2. Update User Status
      const { error: userError } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', userId);

      if (userError) throw userError;

      // 3. Create Audit Log
      const { error: auditError } = await supabase
        .from('application_audit_logs')
        .insert({
          application_type: activeTab,
          application_id: id,
          actor_id: adminUser.id,
          old_status: applications.find(a => a.id === id)?.status,
          new_status: newStatus,
          reason: `Admin action: ${newStatus}`
        });

      if (auditError) console.error('Audit log error:', auditError); // Non-blocking

      // Refresh list
      fetchApplications();

    } catch (err: any) {
      console.error('Error updating status:', err);
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Rejected</span>;
      case 'submitted':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Submitted</span>;
      case 'under_review':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Under Review</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">HR & Applications</h1>
          <p className="text-slate-500">Manage driver and restaurant onboarding applications.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab('driver')}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'driver' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Truck className="w-4 h-4 mr-2" />
            Drivers
          </button>
          <button
            onClick={() => setActiveTab('restaurant')}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'restaurant' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Store className="w-4 h-4 mr-2" />
            Restaurants
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <Filter className="w-5 h-5 text-slate-400" />
        <div className="flex items-center gap-2">
            {['all', 'submitted', 'under_review', 'approved', 'rejected', 'draft'].map((status) => (
                <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                        statusFilter === status 
                        ? 'bg-slate-900 text-white border-slate-900' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                >
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </button>
            ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{error}</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No applications found matching current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Applicant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500">
                            {app.profile_photo_url || app.logo_url ? (
                                <img src={app.profile_photo_url || app.logo_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                            ) : (
                                <span className="text-xs font-bold">{app.legal_name?.[0] || app.restaurant_name?.[0] || '?'}</span>
                            )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">
                            {activeTab === 'driver' ? app.legal_name : app.restaurant_name}
                          </div>
                          <div className="text-sm text-slate-500">{app.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900">
                        {activeTab === 'driver' ? (
                            <>
                                <div>{app.vehicle_make} {app.vehicle_model}</div>
                                <div className="text-slate-500 text-xs">{app.license_state} • {app.vehicle_plate}</div>
                            </>
                        ) : (
                            <>
                                <div>{app.owner_name}</div>
                                <div className="text-slate-500 text-xs">{app.address}</div>
                            </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {app.submitted_at ? format(new Date(app.submitted_at), 'MMM d, yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(app.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {/* View Details (Placeholder for now) */}
                        <button 
                            onClick={() => router.push(`/admin/hr/${activeTab}/${app.id}`)}
                            className="text-slate-400 hover:text-blue-600 p-1" 
                            title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>

                        {(app.status === 'submitted' || app.status === 'under_review') && (
                          <>
                            <button 
                              onClick={() => updateStatus(app.id, 'approved', app.user_id)}
                              disabled={!!processingId}
                              className="text-green-600 hover:text-green-900 p-1 disabled:opacity-50"
                              title="Approve"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => updateStatus(app.id, 'rejected', app.user_id)}
                              disabled={!!processingId}
                              className="text-red-600 hover:text-red-900 p-1 disabled:opacity-50"
                              title="Reject"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
