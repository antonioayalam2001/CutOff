'use client';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function NavigationLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (pathname !== prevPath.current) {
      prevPath.current = pathname;
      setLoading(true);
      const timer = setTimeout(() => setLoading(false), 600);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[2px]">
      <div className="h-full rounded-full bg-gradient-to-r from-primary-500 via-primary-400 to-primary-500 animate-loading-bar" style={{ boxShadow: '0 0 10px rgba(6, 182, 212, 0.3)' }} />
    </div>
  );
}
