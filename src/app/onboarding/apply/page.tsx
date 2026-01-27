'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DriverApplicationForm from '@/components/onboarding/DriverApplicationForm';
import RestaurantApplicationForm from '@/components/onboarding/RestaurantApplicationForm';

export default function ApplyPage() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      
      const role = user.user_metadata.role;
      if (role !== 'driver' && role !== 'restaurant') {
         // If admin or customer ends up here, send them home
         router.push('/');
         return;
      }
      
      setRole(role);
      setLoading(false);
    }
    checkUser();
  }, [router, supabase]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-8 text-center">
        {role === 'driver' ? 'Driver Application' : 'Restaurant Application'}
      </h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        {role === 'driver' ? <DriverApplicationForm /> : <RestaurantApplicationForm />}
      </div>
    </div>
  );
}
