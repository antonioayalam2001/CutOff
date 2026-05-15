'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CreateCardPayload } from '@/types';

export function useCards(groupId: string) {
  return useQuery<Card[]>({
    queryKey: ['cards', groupId],
    queryFn: () => api.get(`/groups/${groupId}/cards`).then((r) => r.data),
    enabled: !!groupId,
  });
}

export function useCreateCard(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCardPayload) =>
      api.post(`/groups/${groupId}/cards`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cards', groupId] }),
  });
}

export function useDeleteCard(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string) =>
      api.delete(`/groups/${groupId}/cards/${cardId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cards', groupId] }),
  });
}
