'use client';
import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useThemeStore } from '@/stores/themeStore';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const shouldReduceMotion = useReducedMotion();
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);

  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-base-950 transition-colors duration-150">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded-lg focus:outline-none"
      >
        Saltar al contenido principal
      </a>
      <nav className="glass-nav sticky top-0 z-40" aria-label="Navegación principal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <Link
                href="/dashboard"
                className="flex items-center gap-2.5 group"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500/20 to-primary-500/5 border border-primary-500/20 flex items-center justify-center group-hover:from-primary-500/30 group-hover:to-primary-500/10 transition-all duration-300">
                  <span className="text-sm font-bold text-gradient">CO</span>
                </div>
                <span className="text-lg font-display font-bold tracking-wider text-gradient">
                  CutOff
                </span>
              </Link>
              <div className="hidden sm:flex items-center gap-1">
                <Link
                  href="/dashboard"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    pathname === '/dashboard'
                      ? 'bg-base-800 text-base-100'
                      : 'text-base-400 hover:text-base-200 hover:bg-base-800'
                  }`}
                >
                  Dashboard
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="hidden sm:inline-flex motion-press items-center px-3 py-1.5 rounded-lg text-sm font-medium text-base-400 hover:text-base-200 hover:bg-base-800"
              >
                Perfil
              </Link>
              <button
                onClick={toggleTheme}
                className="motion-press p-2 rounded-lg text-base-400 hover:text-base-200 hover:bg-base-800"
                aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                aria-pressed={theme !== 'dark'}
              >
                {theme === 'dark' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              {user && (
                <span className="text-sm text-base-400 hidden sm:block">
                  {user.name}
                </span>
              )}
              <button
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
                className="motion-press text-sm text-base-500 hover:text-base-300 px-3 py-1.5 rounded-lg hover:bg-base-800"
                aria-label="Cerrar sesión"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </nav>
      <motion.main
        id="main-content"
        key={pathname}
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {children}
      </motion.main>
    </div>
  );
}
