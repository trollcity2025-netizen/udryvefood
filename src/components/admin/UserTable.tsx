'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useAdminView } from '@/context/AdminViewContext';

type UserRole = 'admin' | 'driver' | 'restaurant' | 'customer';
type UserStatus = 'active' | 'disabled' | 'frozen' | 'pending_approval';

interface UserData {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  freeze_reason?: string | null;
  disable_reason?: string | null;
}

export default function UserTable({ initialUsers }: { initialUsers: UserData[] }) {
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [loading, setLoading] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const { setViewRole } = useAdminView();

  const handleRoleSwitch = async (userId: string, newRole: UserRole) => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
    
    setLoading(userId);
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      alert(`User role updated to ${newRole}`);
    } catch (err: any) {
      alert('Error updating role: ' + err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleViewAs = (role: UserRole) => {
    setViewRole(role);
    if (role === 'admin') router.push('/admin');
    else if (role === 'driver') router.push('/driver');
    else if (role === 'restaurant') router.push('/restaurant');
    else router.push('/customer');
  };

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    let reason: string | null = null;
    if (newStatus === 'frozen' || newStatus === 'disabled') {
      reason = prompt(`Enter reason for marking as ${newStatus}:`);
      if (!reason) return; // Cancel if no reason provided
    }

    setLoading(userId);
    try {
      const { error } = await supabase.rpc('admin_update_user_status', {
        target_user_id: userId,
        new_status: newStatus,
        reason: reason
      });

      if (error) throw error;

      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus, freeze_reason: newStatus === 'frozen' ? reason : u.freeze_reason, disable_reason: newStatus === 'disabled' ? reason : u.disable_reason } : u));
      alert(`User status updated to ${newStatus}`);
    } catch (err: any) {
      alert('Error updating status: ' + err.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-slate-50/50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-100">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-slate-900">{user.email}</div>
                {user.status === 'frozen' && user.freeze_reason && (
                    <div className="text-xs text-red-500">Frozen: {user.freeze_reason}</div>
                )}
                {user.status === 'disabled' && user.disable_reason && (
                    <div className="text-xs text-red-500">Disabled: {user.disable_reason}</div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <select 
                  value={user.role}
                  onChange={(e) => handleRoleSwitch(user.id, e.target.value as UserRole)}
                  className={`px-2 py-1 text-xs font-semibold rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500
                  ${user.role === 'admin' ? 'bg-indigo-50 text-indigo-700' : 
                    user.role === 'driver' ? 'bg-sky-50 text-sky-700' : 
                    user.role === 'restaurant' ? 'bg-rose-50 text-rose-700' : 
                    'bg-emerald-50 text-emerald-700'}`}
                >
                    <option value="admin">admin</option>
                    <option value="driver">driver</option>
                    <option value="restaurant">restaurant</option>
                    <option value="customer">customer</option>
                </select>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2.5 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${user.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 
                    user.status === 'frozen' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 
                    'bg-red-50 text-red-700 border border-red-200'}`}>
                  {user.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                {new Date(user.created_at).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                {user.status !== 'active' && (
                  <button 
                    onClick={() => handleStatusChange(user.id, 'active')}
                    className="text-emerald-600 hover:text-emerald-800"
                    disabled={loading === user.id}
                  >
                    Activate
                  </button>
                )}
                {user.status !== 'frozen' && (
                  <button 
                    onClick={() => handleStatusChange(user.id, 'frozen')}
                    className="text-amber-600 hover:text-amber-800"
                    disabled={loading === user.id}
                  >
                    Freeze
                  </button>
                )}
                {user.status !== 'disabled' && (
                  <button 
                    onClick={() => handleStatusChange(user.id, 'disabled')}
                    className="text-red-600 hover:text-red-900"
                    disabled={loading === user.id}
                  >
                    Disable
                  </button>
                )}
                <button 
                    onClick={() => handleViewAs(user.role)}
                    className="text-indigo-600 hover:text-indigo-900 ml-2 border-l pl-2 border-slate-200"
                    title={`View as ${user.role}`}
                >
                    View
                </button>
                {loading === user.id && <span className="text-slate-400">Updating...</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
