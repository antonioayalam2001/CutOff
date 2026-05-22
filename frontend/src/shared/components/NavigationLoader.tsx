'use client';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';

export function NavigationLoader() {
  const shouldReduceMotion = useReducedMotion();
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
    <motion.div className="fixed top-0 left-0 right-0 z-[9999] h-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-primary-500 via-primary-300 to-primary-500"
        style={{ boxShadow: '0 0 12px rgba(6, 182, 212, 0.4)' }}
        initial={{ width: '0%', x: '0%' }}
        animate={shouldReduceMotion ? { width: '100%', x: '0%' } : { width: ['0%', '38%', '72%', '100%'], x: ['0%', '0%', '22%', '100%'] }}
        transition={shouldReduceMotion ? { duration: 0.18 } : { duration: 0.75, ease: [0.23, 1, 0.32, 1] }}
      />
    </motion.div>
  );
}
