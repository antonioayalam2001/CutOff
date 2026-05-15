'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { BillingResponse } from '@/types';

export function useBilling(groupId: string, year?: number, month?: number) {
  return useQuery<BillingResponse>({
    queryKey: ['billing', groupId, year, month],
    queryFn: () =>
      api
        .get(`/groups/${groupId}/billing`, { params: { year, month } })
        .then((r) => r.data),
    enabled: !!groupId,
  });
}
