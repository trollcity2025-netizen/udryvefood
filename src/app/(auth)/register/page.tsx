'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['customer', 'driver', 'restaurant', 'admin']),
  fullName: z.string().min(2, 'Full Name is required'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'customer',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
          data: {
            full_name: data.fullName,
            role: data.role,
          },
        },
      });

      if (authError) throw authError;

      // 2. Insert into public.users table (if not handled by trigger yet, but we will add a trigger)
      // Ideally, the trigger handles this. If we do it manually here, we need to be careful of RLS.
      // We will rely on the Postgres Trigger for reliability, but for now, we can also try to insert if the trigger isn't there?
      // No, let's rely on the metadata and trigger.
      
      router.push('/login?message=Check your email to verify your account');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F6FA] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Or{' '}
            <Link href="/login" className="font-medium text-orange-600 hover:text-orange-500 transition-colors">
              sign in to your existing account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-lg shadow-sm -space-y-px">
            <div>
              <label htmlFor="fullName" className="sr-only">Full Name</label>
              <input
                {...register('fullName')}
                id="fullName"
                type="text"
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-t-lg focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm transition-colors"
                placeholder="Full Name"
              />
              {errors.fullName && <p className="text-red-500 text-xs mt-1 px-1">{errors.fullName.message}</p>}
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                {...register('email')}
                id="email-address"
                type="email"
                autoComplete="email"
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-200 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm transition-colors"
                placeholder="Email address"
              />
               {errors.email && <p className="text-red-500 text-xs mt-1 px-1">{errors.email.message}</p>}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                {...register('password')}
                id="password"
                type="password"
                autoComplete="new-password"
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm transition-colors"
                placeholder="Password"
              />
               {errors.password && <p className="text-red-500 text-xs mt-1 px-1">{errors.password.message}</p>}
            </div>
            <div>
              <label htmlFor="role" className="sr-only">Role</label>
              <select
                {...register('role')}
                id="role"
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-200 placeholder-slate-400 text-slate-900 rounded-b-lg focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm transition-colors bg-white"
              >
                <option value="customer">Customer</option>
                <option value="driver">Driver</option>
                <option value="restaurant">Restaurant Partner</option>
                <option value="admin">Admin</option>
              </select>
               {errors.role && <p className="text-red-500 text-xs mt-1 px-1">{errors.role.message}</p>}
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 shadow-md hover:shadow-lg transition-all"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
