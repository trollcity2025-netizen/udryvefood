'use client';

import DriverApplicationForm from '@/components/onboarding/DriverApplicationForm';

export default function ApplyToDrivePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Become a Driver</h1>
        <p className="text-slate-500 mt-2">Fill out the application below to start earning with UdryveFood.</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <DriverApplicationForm />
      </div>
    </div>
  );
}
