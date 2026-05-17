'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    store.loadFromStorage();
  }, []);

  return store;
}
