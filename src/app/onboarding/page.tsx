import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Clock, XCircle, FileText, AlertTriangle } from 'lucide-react';

export default async function OnboardingStatusPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return redirect('/login');

  const role = user.user_metadata.role;
  
  // Fetch user status from DB to be sure
  const { data: userData } = await supabase
    .from('users')
    .select('status')
    .eq('id', user.id)
    .single();
    
  const status = userData?.status || 'draft';
  
  // Fetch application if exists
  let application = null;
  const table = role === 'driver' ? 'driver_applications' : 'restaurant_applications';
  
  if (status !== 'draft') {
      const { data: appData } = await supabase
        .from(table)
        .select('*')
        .eq('user_id', user.id)
        .single();
      application = appData;
  }

  // Helper for UI
  const renderContent = () => {
    switch (status) {
        case 'draft':
            return (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-lg w-full text-center">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileText size={32} />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Complete Your Application</h1>
                    <p className="text-slate-600 mb-8">
                        Welcome to UdryveFood! To start {role === 'driver' ? 'driving' : 'selling'}, you need to complete your profile and submit required documents.
                    </p>
                    <Link href="/onboarding/apply" className="inline-flex justify-center w-full px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                        Start Application
                    </Link>
                </div>
            );
        case 'submitted':
        case 'under_review':
            return (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-lg w-full text-center">
                    <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Clock size={32} />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Application Under Review</h1>
                    <p className="text-slate-600 mb-8">
                        Thank you for applying! Our team is currently reviewing your documents. This usually takes 24-48 hours. You will be notified once approved.
                    </p>
                    <div className="bg-slate-50 p-4 rounded-lg text-left text-sm text-slate-500">
                        <p><strong>Status:</strong> {status === 'submitted' ? 'Submitted' : 'Under Review'}</p>
                        <p><strong>Submitted on:</strong> {application?.submitted_at ? new Date(application.submitted_at).toLocaleDateString() : 'Just now'}</p>
                    </div>
                </div>
            );
        case 'approved':
            return (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-lg w-full text-center">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={32} />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">You are Approved!</h1>
                    <p className="text-slate-600 mb-8">
                        Congratulations! Your account has been approved. You can now access your dashboard and start using UdryveFood.
                    </p>
                    <Link href={`/${role}`} className="inline-flex justify-center w-full px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 transition-colors">
                        Go to Dashboard
                    </Link>
                </div>
            );
        case 'changes_requested':
            return (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-lg w-full text-center">
                    <div className="w-16 h-16 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle size={32} />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Changes Requested</h1>
                    <p className="text-slate-600 mb-6">
                        The admin has requested some changes to your application. Please review the feedback and update your details.
                    </p>

                    {application?.admin_notes && (
                        <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg text-left mb-8">
                            <h3 className="text-sm font-semibold text-yellow-800 mb-1">Feedback:</h3>
                            <p className="text-sm text-yellow-700">{application.admin_notes}</p>
                        </div>
                    )}

                    <Link href="/onboarding/apply" className="inline-flex justify-center w-full px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                        Update Application
                    </Link>
                </div>
            );
        case 'rejected':
            return (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-lg w-full text-center">
                    <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <XCircle size={32} />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Action Required</h1>
                    <p className="text-slate-600 mb-6">
                        Unfortunately, your application was not approved. Please review the feedback below and update your application.
                    </p>
                    
                    {application?.rejection_reason && (
                        <div className="bg-red-50 border border-red-100 p-4 rounded-lg text-left mb-8">
                            <h3 className="text-sm font-semibold text-red-800 mb-1">Reason:</h3>
                            <p className="text-sm text-red-700">{application.rejection_reason}</p>
                        </div>
                    )}

                    <Link href="/onboarding/apply" className="inline-flex justify-center w-full px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-slate-900 hover:bg-slate-800 transition-colors">
                        Update Application
                    </Link>
                </div>
            );
        case 'disabled':
             return (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-lg w-full text-center">
                    <div className="w-16 h-16 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle size={32} />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Account Disabled</h1>
                    <p className="text-slate-600 mb-8">
                        Your account has been disabled by the administration. Please contact support for more information.
                    </p>
                </div>
            );
        default:
            return <div>Loading...</div>;
    }
  };

  return renderContent();
}
