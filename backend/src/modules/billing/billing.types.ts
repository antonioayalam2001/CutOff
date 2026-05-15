export interface ExpenseSummary {
  id: string;
  concept: string;
  amount: number;
  transactionDate: string;
  isMSI: boolean;
  totalInstallments: number | null;
  currentInstallment: number | null;
  installmentGroupId: string | null;
}

export interface CardSummary {
  cardId: string;
  cardName: string;
  lastFourDigits: string;
  cutOffDay: number;
  paymentDeadlineDay: number;
  currentCycleTotal: number;
  nextCycleTotal: number;
  expenses: ExpenseSummary[];
}

export interface UserBillingSummary {
  userId: string;
  userName: string;
  cards: CardSummary[];
  totalCurrentCycle: number;
  totalNextCycle: number;
}

export interface BillingResponse {
  summary: UserBillingSummary[];
}
