import { createClient } from '@/utils/supabase/server';
import UserTable from '@/components/admin/UserTable';

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return <div className="p-8 text-red-500">Error loading users: {error.message}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">User Management</h1>
      
      <div className="bg-white shadow-sm overflow-hidden rounded-xl border border-slate-100">
        <UserTable initialUsers={users || []} />
      </div>
    </div>
  );
}
