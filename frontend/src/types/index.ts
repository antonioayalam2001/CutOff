export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
  owner?: User;
  members?: GroupMember[];
  cards?: Card[];
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  status: MemberStatus;
  createdAt: string;
  user: User;
}

export enum MemberStatus {
  PENDING = 'Pendiente',
  APPROVED = 'Aprobado',
  REJECTED = 'Rechazado',
}

export interface Card {
  id: string;
  groupId: string;
  name: string;
  lastFourDigits: string;
  cutOffDay: number;
  paymentDeadlineDay: number;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  cardId: string;
  userId: string;
  concept: string;
  amount: string;
  transactionDate: string;
  isMSI: boolean;
  totalInstallments: number | null;
  currentInstallment: number | null;
  installmentGroupId: string | null;
  createdAt: string;
  updatedAt: string;
  card?: Card;
  user?: User;
}

export interface CreateExpensePayload {
  cardId: string;
  userId?: string;
  concept: string;
  amount: number;
  transactionDate: string;
  isMSI?: boolean;
  totalInstallments?: number;
}

export interface CreateCardPayload {
  name: string;
  lastFourDigits: string;
  cutOffDay: number;
  paymentDeadlineDay: number;
}

export interface BillingExpense {
  id: string;
  concept: string;
  amount: number;
  transactionDate: string;
  isMSI: boolean;
  totalInstallments: number | null;
  currentInstallment: number | null;
  installmentGroupId: string | null;
  cycle: 'current' | 'next';
}

export interface CardBillingSummary {
  cardId: string;
  cardName: string;
  lastFourDigits: string;
  cutOffDay: number;
  paymentDeadlineDay: number;
  currentCycleTotal: number;
  nextCycleTotal: number;
  expenses: BillingExpense[];
}

export interface UserBillingSummary {
  userId: string;
  userName: string;
  cards: CardBillingSummary[];
  totalCurrentCycle: number;
  totalNextCycle: number;
}

export interface BillingResponse {
  summary: UserBillingSummary[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuthResponse {
  user: { id: string; name: string; email: string };
  token: string;
}
