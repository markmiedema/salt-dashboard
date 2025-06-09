import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

export type UserRole = 'viewer' | 'editor' | 'admin';

export const useUserRole = (): UserRole => {
  const [role, setRole] = useState<UserRole>('viewer');

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to fetch user role:', error);
          return;
        }
        const userRole = (data.user?.user_metadata?.role as UserRole) || 'viewer';
        setRole(userRole);
      })
      .catch(console.error);
  }, []);

  return role;
};
