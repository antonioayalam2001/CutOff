import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual, Between, In, ILike } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Expense } from './expense.entity';
import { CreateExpenseDto, ExpenseSplitDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { FindAllExpensesDto } from './dto/find-all-expenses.dto';
import { GroupsService } from '../groups/groups.service';
import { CardsService } from '../cards/cards.service';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    private readonly groupsService: GroupsService,
    private readonly cardsService: CardsService,
  ) {}

  async bulkCreate(groupId: string, userId: string, dtos: CreateExpenseDto[]): Promise<Expense[]> {
    if (dtos.length === 0) {
      throw new BadRequestException('No expenses provided');
    }
    const results: Expense[] = [];
    for (const dto of dtos) {
      const created = await this.create(groupId, userId, dto);
      results.push(...created);
    }
    return results;
  }

  async create(
    groupId: string,
    userId: string,
    dto: CreateExpenseDto,
  ): Promise<Expense[]> {
    const isOwner = await this.groupsService.isOwner(groupId, userId);
    const targetUserId = isOwner && dto.userId ? dto.userId : userId;

    if (!isOwner && dto.userId && dto.userId !== userId) {
      throw new ForbiddenException('Standard users can only create expenses for themselves');
    }

    if (!isOwner) {
      const members = await this.groupsService.getApprovedMemberIds(groupId);
      if (!members.includes(userId)) {
        throw new ForbiddenException('You are not an approved member');
      }
    }

    if (dto.isSplit && !isOwner) {
      throw new ForbiddenException('Only the group owner can create split expenses');
    }

    const card = await this.cardsService.findById(dto.cardId);
    if (card.groupId !== groupId) {
      throw new BadRequestException('Card does not belong to this group');
    }

    if (dto.isMSI && dto.isSplit) {
      return this.createSplitMSIExpenses(dto);
    }

    if (dto.isMSI) {
      return this.createMSIExpenses(targetUserId, dto);
    }

    if (dto.isSplit) {
      return this.createSplitExpenses(groupId, isOwner, userId, dto);
    }

    if (dto.isRecurring) {
      return this.createRecurringExpenses(targetUserId, dto);
    }

    const expense = this.expenseRepository.create({
      cardId: dto.cardId,
      userId: targetUserId,
      concept: dto.concept,
      amount: dto.amount,
      transactionDate: dto.transactionDate,
      isMSI: false,
    });
    const saved = await this.expenseRepository.save(expense);
    return [saved];
  }

  private async createRecurringExpenses(
    userId: string,
    dto: CreateExpenseDto,
  ): Promise<Expense[]> {
    const totalMonths = dto.recurringMonths || 2;
    if (totalMonths < 2) {
      throw new BadRequestException('Recurring requires at least 2 months');
    }

    const recurringGroupId = uuidv4();
    const expenses: Expense[] = [];
    const baseDate = new Date(dto.transactionDate);

    for (let i = 1; i <= totalMonths; i++) {
      const date = new Date(baseDate);
      date.setMonth(date.getMonth() + (i - 1));
      const transactionDate = date.toISOString().split('T')[0];

      const expense = this.expenseRepository.create({
        cardId: dto.cardId,
        userId,
        concept: dto.concept,
        amount: dto.amount,
        transactionDate,
        isRecurring: true,
        recurringTotalMonths: totalMonths,
        recurringCurrentMonth: i,
        recurringGroupId,
      });
      expenses.push(expense);
    }

    return this.expenseRepository.save(expenses);
  }

  private async createSplitExpenses(
    groupId: string,
    isOwner: boolean,
    userId: string,
    dto: CreateExpenseDto,
  ): Promise<Expense[]> {
    if (!dto.splits || dto.splits.length < 2) {
      throw new BadRequestException('Split requires at least 2 users');
    }

    const members = await this.groupsService.getApprovedMemberIds(groupId);
    for (const split of dto.splits) {
      if (!members.includes(split.userId)) {
        throw new BadRequestException(`User ${split.userId} is not an approved member`);
      }
    }

    const splitTotal = dto.splits.reduce((sum, s) => sum + s.amount, 0);
    if (Math.abs(splitTotal - dto.amount) > 0.01) {
      throw new BadRequestException('Sum of split amounts must equal the total amount');
    }

    const splitGroupId = uuidv4();

    if (dto.isRecurring) {
      return this.createSplitRecurringExpenses(dto, splitGroupId);
    }

    const expenses = dto.splits.map((split) =>
      this.expenseRepository.create({
        cardId: dto.cardId,
        userId: split.userId,
        concept: dto.concept,
        amount: split.amount,
        transactionDate: dto.transactionDate,
        isSplit: true,
        splitGroupId,
      }),
    );

    return this.expenseRepository.save(expenses);
  }

  private async createSplitRecurringExpenses(
    dto: CreateExpenseDto,
    splitGroupId?: string,
  ): Promise<Expense[]> {
    const totalMonths = dto.recurringMonths || 2;
    if (totalMonths < 2) {
      throw new BadRequestException('Recurring requires at least 2 months');
    }

    const recurringGroupId = uuidv4();
    const allExpenses: Expense[] = [];
    const baseDate = new Date(dto.transactionDate);

    for (let i = 1; i <= totalMonths; i++) {
      const date = new Date(baseDate);
      date.setMonth(date.getMonth() + (i - 1));
      const transactionDate = date.toISOString().split('T')[0];
      const monthSplitGroupId = uuidv4();

      for (const split of dto.splits) {
        const expense = this.expenseRepository.create({
          cardId: dto.cardId,
          userId: split.userId,
          concept: dto.concept,
          amount: split.amount,
          transactionDate,
          isRecurring: true,
          recurringTotalMonths: totalMonths,
          recurringCurrentMonth: i,
          recurringGroupId,
          isSplit: true,
          splitGroupId: monthSplitGroupId,
        });
        allExpenses.push(expense);
      }
    }

    return this.expenseRepository.save(allExpenses);
  }

  private async createSplitMSIExpenses(
    dto: CreateExpenseDto,
  ): Promise<Expense[]> {
    const totalInstallments = dto.totalInstallments || 2;
    if (totalInstallments < 2) {
      throw new BadRequestException('MSI requires at least 2 installments');
    }

    if (!dto.splits || dto.splits.length < 2) {
      throw new BadRequestException('Split requires at least 2 users');
    }

    const splitPerMonth = dto.splits.reduce((sum, s) => sum + s.amount, 0);
    const monthlyTarget = dto.amount / totalInstallments;
    if (Math.abs(splitPerMonth - monthlyTarget) > 0.01) {
      throw new BadRequestException('Sum of split amounts must equal the monthly installment');
    }

    const installmentAmount = this.roundAmount(dto.amount / totalInstallments);
    const installmentRemainder = this.roundAmount(dto.amount - installmentAmount * (totalInstallments - 1));

    const installmentGroupId = uuidv4();
    const expenses: Expense[] = [];
    const baseDate = new Date(dto.transactionDate);

    for (let i = 1; i <= totalInstallments; i++) {
      const monthlyAmount = i === totalInstallments ? installmentRemainder : installmentAmount;
      const numUsers = dto.splits.length;
      const perUser = this.roundAmount(monthlyAmount / numUsers);
      const userRemainder = this.roundAmount(monthlyAmount - perUser * (numUsers - 1));

      const monthSplitGroupId = uuidv4();
      const date = new Date(baseDate);
      date.setMonth(date.getMonth() + (i - 1));
      const transactionDate = date.toISOString().split('T')[0];

      for (let j = 0; j < numUsers; j++) {
        const amount = j === numUsers - 1 ? userRemainder : perUser;
        const expense = this.expenseRepository.create({
          cardId: dto.cardId,
          userId: dto.splits[j].userId,
          concept: dto.concept,
          amount,
          transactionDate,
          isMSI: true,
          totalInstallments,
          currentInstallment: i,
          installmentGroupId,
          isSplit: true,
          splitGroupId: monthSplitGroupId,
        });
        expenses.push(expense);
      }
    }

    return this.expenseRepository.save(expenses);
  }

  private async createMSIExpenses(
    userId: string,
    dto: CreateExpenseDto,
  ): Promise<Expense[]> {
    const totalInstallments = dto.totalInstallments || 2;
    if (totalInstallments < 2) {
      throw new BadRequestException('MSI requires at least 2 installments');
    }

    const installmentAmount = this.roundAmount(dto.amount / totalInstallments);
    const remainder = this.roundAmount(dto.amount - installmentAmount * (totalInstallments - 1));

    const installmentGroupId = uuidv4();
    const expenses: Expense[] = [];
    const baseDate = new Date(dto.transactionDate);

    for (let i = 1; i <= totalInstallments; i++) {
      const amount = i === totalInstallments ? remainder : installmentAmount;
      const date = new Date(baseDate);
      date.setMonth(date.getMonth() + (i - 1));
      const transactionDate = date.toISOString().split('T')[0];

      const expense = this.expenseRepository.create({
        cardId: dto.cardId,
        userId,
        concept: dto.concept,
        amount,
        transactionDate,
        isMSI: true,
        totalInstallments,
        currentInstallment: i,
        installmentGroupId,
      });
      expenses.push(expense);
    }

    return this.expenseRepository.save(expenses);
  }

  async findAll(
    groupId: string,
    userId: string,
    query: FindAllExpensesDto = { page: 1, limit: 10 },
  ): Promise<{
    data: (Expense & { splitUsers?: { id: string; name: string }[] })[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const isOwner = await this.groupsService.isOwner(groupId, userId);
    const { page, limit, dateFrom, dateTo, cardId, search } = query;

    const memberFilter = isOwner ? {} : { userId };

    const cards = await this.cardsService.findByGroup(groupId);
    const cardIds = cards.map((c) => c.id);
    if (cardIds.length === 0) return { data: [], total: 0, page, limit, totalPages: 0 };

    if (!isOwner) {
      const members = await this.groupsService.getApprovedMemberIds(groupId);
      if (!members.includes(userId)) {
        throw new ForbiddenException('You are not an approved member');
      }
    }

    const targetCardIds = cardId ? (cardIds.includes(cardId) ? [cardId] : []) : cardIds;
    if (targetCardIds.length === 0) return { data: [], total: 0, page, limit, totalPages: 0 };

    const where = this.buildWhereClause(targetCardIds, memberFilter, dateFrom, dateTo, search);
    const [data, total] = await this.expenseRepository.findAndCount({
      where,
      relations: ['card', 'user'],
      order: { transactionDate: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const splitGroupIds = [...new Set(data.filter((e) => e.isSplit && e.splitGroupId).map((e) => e.splitGroupId))];
    if (splitGroupIds.length > 0) {
      const splitExpenses = await this.expenseRepository.find({
        where: { splitGroupId: In(splitGroupIds) },
        relations: ['user'],
      });
      const splitUsersMap = new Map<string, { id: string; name: string }[]>();
      for (const se of splitExpenses) {
        if (!se.user) continue;
        const key = se.splitGroupId;
        if (!splitUsersMap.has(key)) splitUsersMap.set(key, []);
        if (!splitUsersMap.get(key).some((u) => u.id === se.user.id)) {
          splitUsersMap.get(key).push({ id: se.user.id, name: se.user.name });
        }
      }
      for (const expense of data) {
        if (expense.splitGroupId && splitUsersMap.has(expense.splitGroupId)) {
          (expense as any).splitUsers = splitUsersMap.get(expense.splitGroupId);
        }
      }
    }

    return { data: data as any, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  private buildWhereClause(
    cardIds: string[],
    memberFilter: Record<string, any>,
    dateFrom?: string,
    dateTo?: string,
    search?: string,
  ): Record<string, any>[] {
    return cardIds.map((cardId) => {
      const condition: Record<string, any> = { cardId, ...memberFilter };
      if (dateFrom && dateTo) {
        condition.transactionDate = Between(dateFrom, dateTo);
      } else if (dateFrom) {
        condition.transactionDate = MoreThanOrEqual(dateFrom);
      } else if (dateTo) {
        condition.transactionDate = LessThanOrEqual(dateTo);
      }
      if (search) {
        condition.concept = ILike(`%${search}%`);
      }
      return condition;
    });
  }

  async findById(id: string): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({
      where: { id },
      relations: ['card', 'user'],
    });
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  async findByCardIds(cardIds: string[]): Promise<Expense[]> {
    if (cardIds.length === 0) return [];
    return this.expenseRepository.find({
      where: cardIds.map((id) => ({ cardId: id })),
      relations: ['card', 'user'],
    });
  }

  async update(
    groupId: string,
    expenseId: string,
    userId: string,
    dto: UpdateExpenseDto,
  ): Promise<Expense> {
    const isOwner = await this.groupsService.isOwner(groupId, userId);
    if (!isOwner) {
      throw new ForbiddenException('Only the group owner can update expenses');
    }

    const expense = await this.findById(expenseId);

    const card = await this.cardsService.findById(expense.cardId);
    if (card.groupId !== groupId) {
      throw new BadRequestException('Expense does not belong to this group');
    }

    if (dto.isSplit === true && !expense.isSplit && !expense.isMSI && !expense.isRecurring) {
      return this.convertToSplitExpense(groupId, expense, dto);
    }

    if (expense.isMSI && expense.installmentGroupId) {
      if (dto.amount !== undefined) throw new BadRequestException('Cannot change amount of an MSI expense');
      if (dto.cardId !== undefined) throw new BadRequestException('Cannot change card of an MSI expense');
      if (dto.transactionDate !== undefined) throw new BadRequestException('Cannot change date of an MSI expense');
    }

    if (expense.isRecurring && expense.recurringGroupId) {
      if (dto.amount !== undefined) throw new BadRequestException('Cannot change amount of a recurring expense');
      if (dto.cardId !== undefined) throw new BadRequestException('Cannot change card of a recurring expense');
      if (dto.transactionDate !== undefined) throw new BadRequestException('Cannot change date of a recurring expense');
    }

    if (expense.isSplit && expense.splitGroupId) {
      if (dto.amount !== undefined) throw new BadRequestException('Cannot change amount of a split expense');
      if (dto.cardId !== undefined) throw new BadRequestException('Cannot change card of a split expense');
      if (dto.transactionDate !== undefined) throw new BadRequestException('Cannot change date of a split expense');
    }

    if (dto.userId !== undefined) {
      const members = await this.groupsService.getApprovedMemberIds(groupId);
      if (!members.includes(dto.userId)) throw new BadRequestException('Target user is not an approved member');
    }

    if (dto.cardId !== undefined) {
      const newCard = await this.cardsService.findById(dto.cardId);
      if (newCard.groupId !== groupId) throw new BadRequestException('Card does not belong to this group');
    }

    const updateData: Partial<Expense> = {};
    if (dto.userId !== undefined) updateData.userId = dto.userId;
    if (dto.concept !== undefined) updateData.concept = dto.concept;
    if (dto.amount !== undefined) updateData.amount = dto.amount;
    if (dto.transactionDate !== undefined) updateData.transactionDate = dto.transactionDate;
    if (dto.cardId !== undefined) updateData.cardId = dto.cardId;

    if (Object.keys(updateData).length === 0) return expense;

    if (expense.installmentGroupId) {
      await this.expenseRepository.update({ installmentGroupId: expense.installmentGroupId }, updateData);
    } else if (expense.recurringGroupId) {
      await this.expenseRepository.update({ recurringGroupId: expense.recurringGroupId, recurringCurrentMonth: MoreThanOrEqual(expense.recurringCurrentMonth) }, updateData);
    } else if (expense.splitGroupId) {
      await this.expenseRepository.update({ splitGroupId: expense.splitGroupId }, updateData);
    } else {
      await this.expenseRepository.update(expenseId, updateData);
    }

    return this.findById(expenseId);
  }

  async bulkDelete(groupId: string, userId: string, ids: string[]): Promise<{ deleted: number }> {
    const isOwner = await this.groupsService.isOwner(groupId, userId);
    if (!isOwner) throw new ForbiddenException('Only the group owner can delete expenses');

    const expenses = await this.expenseRepository.find({
      where: ids.map((id) => ({ id })),
      relations: ['card'],
    });

    const groupCardIds = (await this.cardsService.findByGroup(groupId)).map((c) => c.id);
    const toDelete = expenses.filter((e) => groupCardIds.includes(e.cardId));
    if (toDelete.length === 0) return { deleted: 0 };

    const msiGroupIds = [...new Set(toDelete.filter((e) => e.isMSI && e.installmentGroupId).map((e) => e.installmentGroupId))];
    const recurringGroupIds = [...new Set(toDelete.filter((e) => e.isRecurring && e.recurringGroupId).map((e) => e.recurringGroupId))];
    const splitGroupIds = [...new Set(toDelete.filter((e) => e.isSplit && e.splitGroupId && !e.isRecurring).map((e) => e.splitGroupId))];

    const simpleToDelete = toDelete.filter(
      (e) => (!e.isMSI || !e.installmentGroupId) && (!e.isRecurring || !e.recurringGroupId) && (!e.isSplit || !e.splitGroupId),
    );

    let count = 0;

    if (simpleToDelete.length > 0) {
      await this.expenseRepository.remove(simpleToDelete);
      count += simpleToDelete.length;
    }

    for (const igId of msiGroupIds) {
      const result = await this.expenseRepository.delete({ installmentGroupId: igId });
      count += result.affected || 0;
    }

    for (const rgId of recurringGroupIds) {
      const target = toDelete.find((e) => e.recurringGroupId === rgId);
      if (target) {
        const minMonth = target.recurringCurrentMonth;
        const result = await this.expenseRepository.delete({
          recurringGroupId: rgId,
          recurringCurrentMonth: MoreThanOrEqual(minMonth),
        });
        count += result.affected || 0;
      }
    }

    for (const sgId of splitGroupIds) {
      const result = await this.expenseRepository.delete({ splitGroupId: sgId });
      count += result.affected || 0;
    }

    return { deleted: count };
  }

  async delete(groupId: string, expenseId: string, userId: string): Promise<void> {
    const isOwner = await this.groupsService.isOwner(groupId, userId);
    if (!isOwner) throw new ForbiddenException('Only the group owner can delete expenses');

    const expense = await this.findById(expenseId);

    const card = await this.cardsService.findById(expense.cardId);
    if (card.groupId !== groupId) throw new BadRequestException('Expense does not belong to this group');

    if (expense.installmentGroupId) {
      await this.expenseRepository.delete({ installmentGroupId: expense.installmentGroupId });
      return;
    }

    if (expense.recurringGroupId) {
      await this.expenseRepository.delete({
        recurringGroupId: expense.recurringGroupId,
        recurringCurrentMonth: MoreThanOrEqual(expense.recurringCurrentMonth),
      });
      return;
    }

    if (expense.splitGroupId) {
      await this.expenseRepository.delete({ splitGroupId: expense.splitGroupId });
      return;
    }

    await this.expenseRepository.remove(expense);
  }

  private async convertToSplitExpense(
    groupId: string,
    originalExpense: Expense,
    dto: UpdateExpenseDto,
  ): Promise<Expense> {
    if (!dto.splits || dto.splits.length < 2) {
      throw new BadRequestException('Split requires at least 2 users');
    }

    const amount = dto.amount ?? originalExpense.amount;
    const cardId = dto.cardId ?? originalExpense.cardId;
    const concept = dto.concept ?? originalExpense.concept;
    const transactionDate = dto.transactionDate ?? originalExpense.transactionDate;

    const members = await this.groupsService.getApprovedMemberIds(groupId);
    for (const split of dto.splits) {
      if (!members.includes(split.userId)) {
        throw new BadRequestException(`User ${split.userId} is not an approved member`);
      }
    }

    const splitTotal = dto.splits.reduce((sum, s) => sum + s.amount, 0);
    if (Math.abs(splitTotal - amount) > 0.01) {
      throw new BadRequestException('Sum of split amounts must equal the total amount');
    }

    if (cardId !== originalExpense.cardId) {
      const newCard = await this.cardsService.findById(cardId);
      if (newCard.groupId !== groupId) throw new BadRequestException('Card does not belong to this group');
    }

    const splitGroupId = uuidv4();
    const expenses = dto.splits.map((split) =>
      this.expenseRepository.create({
        cardId,
        userId: split.userId,
        concept,
        amount: split.amount,
        transactionDate,
        isSplit: true,
        splitGroupId,
      }),
    );

    const created = await this.expenseRepository.save(expenses);

    await this.expenseRepository.remove(originalExpense);

    return this.findById(created[0].id);
  }

  private roundAmount(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
