import { Injectable, ForbiddenException } from '@nestjs/common';
import { CardsService } from '../cards/cards.service';
import { ExpensesService } from '../expenses/expenses.service';
import { GroupsService } from '../groups/groups.service';
import { Expense } from '../expenses/expense.entity';
import { ExpenseSummary, CardSummary, UserBillingSummary, BillingResponse } from './billing.types';

@Injectable()
export class BillingService {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly cardsService: CardsService,
    private readonly expensesService: ExpensesService,
  ) {}

  async getSummary(groupId: string, userId: string, year?: number, month?: number): Promise<BillingResponse> {
    const now = new Date();
    const refYear = year ?? now.getFullYear();
    const refMonth = month !== undefined ? month - 1 : now.getMonth();

    const isOwner = await this.groupsService.isOwner(groupId, userId);

    if (!isOwner) {
      const members = await this.groupsService.getApprovedMemberIds(groupId);
      if (!members.includes(userId)) {
        throw new ForbiddenException('You are not an approved member');
      }
      const result = await this.buildUserSummary(groupId, userId, refYear, refMonth);
      return { summary: [result] };
    }

    const members = await this.groupsService.getApprovedMemberIds(groupId);
    const summaries = await Promise.all(
      members.map((memberId) => this.buildUserSummary(groupId, memberId, refYear, refMonth)),
    );

    return { summary: summaries };
  }

  private async buildUserSummary(
    groupId: string,
    targetUserId: string,
    refYear: number,
    refMonth: number,
  ): Promise<UserBillingSummary> {
    const cards = await this.cardsService.findByGroup(groupId);
    const cardIds = cards.map((c) => c.id);
    const userExpenses = await this.expensesService.findByCardIds(cardIds, targetUserId);

    const userName = userExpenses.length > 0 ? userExpenses[0].user?.name || 'Unknown' : 'Unknown';

    const cardSummaries: CardSummary[] = cards.map((card) => {
      const cardExpenses = userExpenses.filter((e) => e.cardId === card.id);

      const classified = this.classifyExpenses(cardExpenses, card.cutOffDay, refYear, refMonth);

      return {
        cardId: card.id,
        cardName: card.name,
        lastFourDigits: card.lastFourDigits,
        cutOffDay: card.cutOffDay,
        paymentDeadlineDay: card.paymentDeadlineDay,
        currentCycleTotal: classified.currentCycleTotal,
        nextCycleTotal: classified.nextCycleTotal,
        expenses: classified.expenses,
      };
    });

    const totalCurrentCycle = cardSummaries.reduce((sum, c) => sum + c.currentCycleTotal, 0);
    const totalNextCycle = cardSummaries.reduce((sum, c) => sum + c.nextCycleTotal, 0);

    return {
      userId: targetUserId,
      userName,
      cards: cardSummaries,
      totalCurrentCycle,
      totalNextCycle,
    };
  }

  private classifyExpenses(
    expenses: Expense[],
    cutOffDay: number,
    refYear: number,
    refMonth: number,
  ): {
    currentCycleTotal: number;
    nextCycleTotal: number;
    expenses: ExpenseSummary[];
  } {
    const ymd = (y: number, m: number, d: number) => y * 10000 + (m + 1) * 100 + d;

    let currentEndMonth = refMonth;
    let currentEndYear = refYear;

    let currentStartMonth = currentEndMonth - 1;
    let currentStartYear = currentEndYear;
    if (currentStartMonth < 0) {
      currentStartMonth = 11;
      currentStartYear--;
    }

    let nextEndMonth = currentEndMonth + 1;
    let nextEndYear = currentEndYear;
    if (nextEndMonth > 11) {
      nextEndMonth = 0;
      nextEndYear++;
    }

    const currentStartKey = ymd(currentStartYear, currentStartMonth, cutOffDay + 1);
    const currentEndKey = ymd(currentEndYear, currentEndMonth, cutOffDay);
    const nextEndKey = ymd(nextEndYear, nextEndMonth, cutOffDay);

    let currentTotal = 0;
    let nextTotal = 0;

    const classified = expenses
      .filter((e) => {
        const tx = new Date(e.transactionDate);
        const key = ymd(tx.getFullYear(), tx.getMonth(), tx.getDate());
        return key >= currentStartKey && key <= nextEndKey;
      })
      .map((e) => {
        const tx = new Date(e.transactionDate);
        const key = ymd(tx.getFullYear(), tx.getMonth(), tx.getDate());
        const amount = typeof e.amount === 'string' ? parseFloat(e.amount) : e.amount;

        let cycle: 'current' | 'next';
        if (key >= currentStartKey && key <= currentEndKey) {
          cycle = 'current';
          currentTotal += amount;
        } else {
          cycle = 'next';
          nextTotal += amount;
        }

        return {
          id: e.id,
          concept: e.concept,
          amount,
          transactionDate: e.transactionDate,
          isMSI: e.isMSI,
          totalInstallments: e.totalInstallments,
          currentInstallment: e.currentInstallment,
          installmentGroupId: e.installmentGroupId,
          cycle,
        };
      });

    return {
      currentCycleTotal: this.roundAmount(currentTotal),
      nextCycleTotal: this.roundAmount(nextTotal),
      expenses: classified,
    };
  }

  private roundAmount(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
