'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Props {
  groupId: string;
}

const tabs = [
  { href: '', label: 'Resumen', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/cards', label: 'Tarjetas', icon: 'M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
  { href: '/expenses', label: 'Gastos', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { href: '/members', label: 'Miembros', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { href: '/billing', label: 'Facturación', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z' },
];

export function GroupTabs({ groupId }: Props) {
  const pathname = usePathname();
  const currentPath = pathname.replace(`/groups/${groupId}`, '') || '';

  return (
    <nav aria-label="Navegación del grupo">
      <div className="border-b border-base-800 mb-6">
        <div className="relative">
          <div className="flex gap-1 -mb-px overflow-x-auto scrollbar-none">
            {tabs.map((tab) => {
              const isActive = tab.href === ''
                ? currentPath === '' || currentPath === `/${groupId}`
                : currentPath.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={`/groups/${groupId}${tab.href}`}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-1.5 pb-3 px-2 sm:px-3 text-xs sm:text-sm font-medium border-b-2 transition-all duration-200 rounded-t-lg whitespace-nowrap ${
                    isActive
                      ? 'border-primary-500 text-primary-400'
                      : 'border-transparent text-base-400 hover:text-base-200 hover:border-base-600'
                  }`}
                >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
              </Link>
            );
          })}
        </div>
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-base-950 to-transparent pointer-events-none sm:hidden" />
        </div>
      </div>
    </nav>
  );
}
