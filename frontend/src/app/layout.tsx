'use client';
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { Sora, JetBrains_Mono } from 'next/font/google';
import { Layout } from '@/components/Layout';
import { NavigationLoader } from '@/components/NavigationLoader';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import './globals.css';

const fontSora = Sora({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sora',
});

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);
  const initTheme = useThemeStore((s) => s.init);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    initTheme();
    loadFromStorage();
    setInitialized(true);
  }, [initTheme, loadFromStorage]);

  if (!initialized) {
    return (
      <div className="min-h-screen bg-base-950 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="blob absolute -top-40 -left-40 w-[500px] h-[500px] bg-primary-500/10 blur-[100px]" />
          <div className="blob-delayed absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-accent-500/5 blur-[100px]" />
        </div>
        <div className="flex flex-col items-center gap-6 relative">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-2 border-white/10" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-t-primary-400 animate-spin" style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.3))' }} />
          </div>
          <div className="text-center">
            <p className="text-lg font-display font-semibold tracking-wider text-gradient">CutOff</p>
            <p className="text-xs text-base-500 mt-1 tracking-wide">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  return <Layout>{children}</Layout>;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${fontSora.variable} ${fontMono.variable}`}>
      <body>
        <QueryClientProvider client={queryClient}>
          <NavigationLoader />
          <AuthInitializer>{children}</AuthInitializer>
          <Toaster
            position="top-right"
            richColors
            closeButton
            style={{ fontSize: '0.875rem' }}
          />
        </QueryClientProvider>
      </body>
    </html>
  );
}
