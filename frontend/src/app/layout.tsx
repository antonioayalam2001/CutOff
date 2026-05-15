'use client';
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { DM_Serif_Display, DM_Sans, JetBrains_Mono } from 'next/font/google';
import { Layout } from '@/components/Layout';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import './globals.css';

const fontDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-display',
});

const fontSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-sans',
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
      <div className="min-h-screen bg-base-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-lg font-display text-base-400">Gastos Compartidos</p>
          <div className="relative">
            <div className="h-8 w-8 rounded-full border-2 border-base-700" />
            <div className="absolute inset-0 h-8 w-8 rounded-full border-2 border-t-primary-500 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return <Layout>{children}</Layout>;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable}`}>
      <body>
        <QueryClientProvider client={queryClient}>
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
