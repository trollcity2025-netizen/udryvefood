'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

type ViewRole = 'admin' | 'customer' | 'driver' | 'restaurant';

interface AdminViewContextType {
  viewRole: ViewRole;
  setViewRole: (role: ViewRole) => void;
  isRealAdmin: boolean;
}

const AdminViewContext = createContext<AdminViewContextType | undefined>(undefined);

export function AdminViewProvider({ children }: { children: ReactNode }) {
  const [viewRole, setViewRole] = useState<ViewRole>('customer'); // Default to customer view until loaded
  const [isRealAdmin, setIsRealAdmin] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.user_metadata?.role === 'admin') {
      setIsRealAdmin(true);
      setViewRole('admin');
    } else {
        // If not admin, they are stuck with their actual role
        setViewRole((user?.user_metadata?.role as ViewRole) || 'customer');
    }
  };

  return (
    <AdminViewContext.Provider value={{ viewRole, setViewRole, isRealAdmin }}>
      {children}
    </AdminViewContext.Provider>
  );
}

export function useAdminView() {
  const context = useContext(AdminViewContext);
  if (context === undefined) {
    throw new Error('useAdminView must be used within an AdminViewProvider');
  }
  return context;
}
