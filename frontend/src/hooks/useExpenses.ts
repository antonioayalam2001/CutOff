'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Expense, CreateExpensePayload, PaginatedResponse } from '@/types';

interface ExpenseFilters {
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
}

export function useExpenses(groupId: string, filters: ExpenseFilters = {}) {
  const { page = 1, limit = 10, dateFrom, dateTo } = filters;
  return useQuery<PaginatedResponse<Expense>>({
    queryKey: ['expenses', groupId, page, limit, dateFrom, dateTo],
    queryFn: () =>
      api
        .get(`/groups/${groupId}/expenses`, {
          params: { page, limit, dateFrom, dateTo },
        })
        .then((r) => r.data),
    enabled: !!groupId,
  });
}

export function useDeleteExpensesBulk(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      api.delete(`/groups/${groupId}/expenses/bulk`, { data: { ids } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses', groupId] }),
  });
}

export function useCreateExpenseBulk(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (expenses: CreateExpensePayload[]) =>
      api.post(`/groups/${groupId}/expenses/bulk`, { expenses }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses', groupId] }),
  });
}

export function useCreateExpense(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateExpensePayload) =>
      api.post(`/groups/${groupId}/expenses`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses', groupId] }),
  });
}

export function useDeleteExpense(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (expenseId: string) =>
      api.delete(`/groups/${groupId}/expenses/${expenseId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses', groupId] }),
  });
}

export function useUpdateExpense(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ expenseId, ...data }: { expenseId: string } & Record<string, unknown>) =>
      api.patch(`/groups/${groupId}/expenses/${expenseId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses', groupId] }),
  });
}
