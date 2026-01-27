'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Upload, FileText, CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function DriverDocumentsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch profile
    const { data: profileData } = await supabase
      .from('driver_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    setProfile(profileData);

    // Fetch pending/recent updates
    const { data: updatesData } = await supabase
      .from('driver_document_updates')
      .select('*')
      .eq('driver_id', user.id)
      .order('created_at', { ascending: false });
    setUpdates(updatesData || []);

    setLoading(false);
  };

  const uploadFile = async (file: File, type: string, metadata: any = {}) => {
    try {
      setUploading(type);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${type}_${Date.now()}.${fileExt}`;
      const bucket = 'driver-documents';

      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('driver_document_updates')
        .insert({
          driver_id: user.id,
          document_type: type,
          document_url: data.path,
          metadata: metadata
        });

      if (dbError) throw dbError;

      await fetchData();
      alert('Document uploaded for review.');
    } catch (error: any) {
      console.error(error);
      alert('Error uploading document: ' + error.message);
    } finally {
      setUploading(null);
    }
  };

  const getStatus = (type: string) => {
    const pendingUpdate = updates.find(u => u.document_type === type && u.status === 'pending');
    if (pendingUpdate) return { status: 'pending', label: 'Under Review', color: 'text-orange-600 bg-orange-50 border-orange-200' };
    
    // Check current profile status (assuming if URL exists it's valid/approved)
    // In a real app we might have an explicit status column on profile too
    let hasDoc = false;
    if (type === 'license_front') hasDoc = !!profile?.license_front_url;
    if (type === 'license_back') hasDoc = !!profile?.license_back_url;
    if (type === 'insurance') hasDoc = !!profile?.insurance_url;

    if (hasDoc) return { status: 'approved', label: 'Active', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    return { status: 'missing', label: 'Missing', color: 'text-slate-500 bg-slate-50 border-slate-200' };
  };

  const DocumentCard = ({ title, type, description, hasExpiry = false }: { title: string, type: string, description: string, hasExpiry?: boolean }) => {
    const status = getStatus(type);
    const pendingUpdate = updates.find(u => u.document_type === type && u.status === 'pending');
    const rejectedUpdate = updates.find(u => u.document_type === type && u.status === 'rejected');

    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500 mt-1">{description}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}>
            {status.label}
          </span>
        </div>

        {rejectedUpdate && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start">
                <XCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                    <span className="font-semibold">Update Rejected:</span> {rejectedUpdate.rejection_reason || 'No reason provided'}
                </div>
            </div>
        )}

        <div className="mt-4">
            {status.status === 'pending' ? (
                <div className="flex items-center text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                    <Clock className="w-4 h-4 mr-2" />
                    Pending admin approval
                </div>
            ) : (
                <div className="space-y-3">
                    {hasExpiry && (
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Expiration Date</label>
                            <input 
                                type="date" 
                                id={`expiry-${type}`}
                                className="w-full text-sm rounded-lg border-slate-300"
                            />
                        </div>
                    )}
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-slate-400" />
                            <p className="text-sm text-slate-500">
                                {uploading === type ? 'Uploading...' : 'Click to upload'}
                            </p>
                        </div>
                        <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*,.pdf"
                            disabled={!!uploading}
                            onChange={(e) => {
                                if (e.target.files?.[0]) {
                                    const expiryInput = document.getElementById(`expiry-${type}`) as HTMLInputElement;
                                    const metadata = hasExpiry ? { expiry: expiryInput?.value } : {};
                                    if (hasExpiry && !metadata.expiry) {
                                        alert('Please select an expiration date first');
                                        return;
                                    }
                                    uploadFile(e.target.files[0], type, metadata);
                                }
                            }}
                        />
                    </label>
                </div>
            )}
        </div>
      </div>
    );
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Document Management</h1>
        <p className="text-slate-600 mt-2">Keep your documents up to date to maintain your active status.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <DocumentCard 
            title="Driver's License (Front)" 
            type="license_front" 
            description="Clear photo of the front of your license" 
        />
        <DocumentCard 
            title="Driver's License (Back)" 
            type="license_back" 
            description="Clear photo of the back of your license" 
        />
        <DocumentCard 
            title="Insurance Policy" 
            type="insurance" 
            description="Proof of vehicle insurance"
            hasExpiry={true}
        />
      </div>

        {/* Recent History */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900">Upload History</h3>
            </div>
            <div className="divide-y divide-slate-200">
                {updates.length === 0 ? (
                    <div className="p-6 text-center text-slate-500">No upload history</div>
                ) : (
                    updates.map((update) => (
                        <div key={update.id} className="p-4 flex items-center justify-between">
                            <div className="flex items-center">
                                <FileText className="w-5 h-5 text-slate-400 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-slate-900">
                                        {update.document_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {format(new Date(update.created_at), 'MMM d, yyyy h:mm a')}
                                    </p>
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize 
                                ${update.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 
                                  update.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                                  'bg-orange-100 text-orange-700'}`}>
                                {update.status}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    </div>
  );
}
