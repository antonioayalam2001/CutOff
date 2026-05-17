'use client';
import { MemberStatus } from '@/types';

const badgeColors: Record<string, string> = {
  [MemberStatus.PENDING]: 'bg-accent-500/10 text-accent-400 border-accent-500/20',
  [MemberStatus.APPROVED]: 'bg-primary-500/10 text-primary-400 border-primary-500/20',
  [MemberStatus.REJECTED]: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export function Badge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        badgeColors[status] || 'bg-base-800 text-base-300 border-base-700'
      }`}
    >
      {status}
    </span>
  );
}
