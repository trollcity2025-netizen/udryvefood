import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 py-4 px-6 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🍔</span>
          <span className="text-xl font-bold text-slate-900">UdryveFood</span>
        </Link>
        <div className="flex items-center gap-4">
           <span className="text-sm text-slate-600">{user?.email}</span>
           <form action="/auth/signout" method="post">
             <button className="text-sm text-slate-500 hover:text-slate-900">Sign Out</button>
           </form>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-slate-900">
        {children}
      </main>
    </div>
  );
}
