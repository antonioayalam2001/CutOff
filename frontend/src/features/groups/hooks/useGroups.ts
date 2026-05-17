'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Group, GroupMember } from '@/types';

export function useGroups() {
  return useQuery<Group[]>({
    queryKey: ['groups'],
    queryFn: () => api.get('/groups').then((r) => r.data),
  });
}

export function useGroup(id: string) {
  return useQuery<Group>({
    queryKey: ['groups', id],
    queryFn: () => api.get(`/groups/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post('/groups', { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  });
}

export function useJoinGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteCode: string) => api.post('/groups/join', { inviteCode }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  });
}

export function useGroupMembers(groupId: string) {
  return useQuery<GroupMember[]>({
    queryKey: ['groups', groupId, 'members'],
    queryFn: () => api.get(`/groups/${groupId}/members`).then((r) => r.data),
    enabled: !!groupId,
  });
}

export function useUpdateMemberStatus(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, status }: { memberId: string; status: string }) =>
      api.patch(`/groups/${groupId}/members/${memberId}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups', groupId, 'members'] }),
  });
}
