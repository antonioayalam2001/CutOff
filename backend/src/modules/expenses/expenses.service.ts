import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, MoreThanOrEqual, LessThanOrEqual, Between, In, ILike } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Expense } from './expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
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
    private readonly dataSource: DataSource,
  ) {}

  private async runInTransaction<T>(fn: (repo: Repository<Expense>) => Promise<T>): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const repo = queryRunner.manager.getRepository(Expense);
      const result = await fn(repo);
      await queryRunner.commitTransaction();
      return result;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async bulkCreate(groupId: string, userId: string, dtos: CreateExpenseDto[]): Promise<Expense[]> {
    if (dtos.length === 0) {
      throw new BadRequestException('No expenses provided');
    }

    const isOwner = await this.groupsService.isOwner(groupId, userId);

    if (!isOwner) {
      const members = await this.groupsService.getApprovedMemberIds(groupId);
      if (!members.includes(userId)) {
        throw new ForbiddenException('You are not an approved member');
      }
    }

    for (const dto of dtos) {
      if (dto.isSplit && !isOwner) {
        throw new ForbiddenException('Only the group owner can create split expenses');
      }

      const card = await this.cardsService.findById(dto.cardId);
      if (card.groupId !== groupId) {
        throw new BadRequestException(`Card ${dto.cardId} does not belong to this group`);
      }
    }

    return this.runInTransaction(async (repo) => {
      const results: Expense[] = [];
      for (const dto of dtos) {
        const targetUserId = isOwner && dto.userId ? dto.userId : userId;
        const created = await this.createInternal(repo, groupId, targetUserId, dto);
        results.push(...created);
      }
      return results;
    });
  }

  async create(groupId: string, userId: string, dto: CreateExpenseDto): Promise<Expense[]> {
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

    return this.runInTransaction(async (repo) => this.createInternal(repo, groupId, targetUserId, dto));
  }

  private async createInternal(
    repo: Repository<Expense>,
    groupId: string,
    targetUserId: string,
    dto: CreateExpenseDto,
  ): Promise<Expense[]> {
    if (dto.isMSI && dto.isSplit) {
      return this.createSplitMSIExpenses(repo, dto);
    }

    if (dto.isMSI) {
      return this.createMSIExpenses(repo, targetUserId, dto);
    }

    if (dto.isSplit) {
      return this.createSplitExpenses(repo, groupId, dto);
    }

    if (dto.isRecurring) {
      return this.createRecurringExpenses(repo, targetUserId, dto);
    }

    const expense = repo.create({
      cardId: dto.cardId,
      userId: targetUserId,
      concept: dto.concept,
      amount: dto.amount,
      transactionDate: dto.transactionDate,
      isMSI: false,
    });
    const saved = await repo.save(expense);
    return [saved];
  }

  private async createRecurringExpenses(
    repo: Repository<Expense>,
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

      const expense = repo.create({
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

    return repo.save(expenses);
  }

  private async createSplitExpenses(
    repo: Repository<Expense>,
    groupId: string,
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
      return this.createSplitRecurringExpenses(repo, dto);
    }

    const expenses = dto.splits.map((split) =>
      repo.create({
        cardId: dto.cardId,
        userId: split.userId,
        concept: dto.concept,
        amount: split.amount,
        transactionDate: dto.transactionDate,
        isSplit: true,
        splitGroupId,
      }),
    );

    return repo.save(expenses);
  }

  private async createSplitRecurringExpenses(repo: Repository<Expense>, dto: CreateExpenseDto): Promise<Expense[]> {
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

      for (const split of dto.splits!) {
        const expense = repo.create({
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

    return repo.save(allExpenses);
  }

  private async createSplitMSIExpenses(repo: Repository<Expense>, dto: CreateExpenseDto): Promise<Expense[]> {
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
        const expense = repo.create({
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

    return repo.save(expenses);
  }

  private async createMSIExpenses(
    repo: Repository<Expense>,
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

      const expense = repo.create({
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

    return repo.save(expenses);
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
    const { page = 1, limit = 10, dateFrom, dateTo, cardId, search } = query;

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
        const users = splitUsersMap.get(key)!;
        if (!users.some((u) => u.id === se.user.id)) {
          users.push({ id: se.user.id, name: se.user.name });
        }
      }
      for (const expense of data) {
        if (expense.splitGroupId && splitUsersMap.has(expense.splitGroupId)) {
          (expense as any).splitUsers = splitUsersMap.get(expense.splitGroupId)!;
        }
      }
    }

    const resultData: (Expense & { splitUsers?: { id: string; name: string }[] })[] = data as any;
    return { data: resultData, total, page, limit, totalPages: Math.ceil(total / limit) };
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

  async findByCardIds(cardIds: string[], userId?: string): Promise<Expense[]> {
    if (cardIds.length === 0) return [];
    return this.expenseRepository.find({
      where: cardIds.map((id) => ({ cardId: id, ...(userId ? { userId } : {}) })),
      relations: ['card', 'user'],
    });
  }

  async update(groupId: string, expenseId: string, userId: string, dto: UpdateExpenseDto): Promise<Expense> {
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
      await this.expenseRepository.update(
        {
          recurringGroupId: expense.recurringGroupId,
          recurringCurrentMonth: MoreThanOrEqual(expense.recurringCurrentMonth),
        },
        updateData,
      );
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

    const msiGroupIds = [
      ...new Set(toDelete.filter((e) => e.isMSI && e.installmentGroupId).map((e) => e.installmentGroupId)),
    ];
    const recurringGroupIds = [
      ...new Set(toDelete.filter((e) => e.isRecurring && e.recurringGroupId).map((e) => e.recurringGroupId)),
    ];
    const splitGroupIds = [
      ...new Set(toDelete.filter((e) => e.isSplit && e.splitGroupId && !e.isRecurring).map((e) => e.splitGroupId)),
    ];

    const simpleToDelete = toDelete.filter(
      (e) =>
        (!e.isMSI || !e.installmentGroupId) &&
        (!e.isRecurring || !e.recurringGroupId) &&
        (!e.isSplit || !e.splitGroupId),
    );

    return this.runInTransaction(async (repo) => {
      let count = 0;

      if (simpleToDelete.length > 0) {
        await repo.remove(simpleToDelete);
        count += simpleToDelete.length;
      }

      for (const igId of msiGroupIds) {
        const result = await repo.delete({ installmentGroupId: igId });
        count += result.affected || 0;
      }

      for (const rgId of recurringGroupIds) {
        const target = toDelete.find((e) => e.recurringGroupId === rgId);
        if (target) {
          const minMonth = target.recurringCurrentMonth;
          const result = await repo.delete({
            recurringGroupId: rgId,
            recurringCurrentMonth: MoreThanOrEqual(minMonth),
          });
          count += result.affected || 0;
        }
      }

      for (const sgId of splitGroupIds) {
        const result = await repo.delete({ splitGroupId: sgId });
        count += result.affected || 0;
      }

      return { deleted: count };
    });
  }

  async delete(groupId: string, expenseId: string, userId: string): Promise<void> {
    const isOwner = await this.groupsService.isOwner(groupId, userId);
    if (!isOwner) throw new ForbiddenException('Only the group owner can delete expenses');

    const expense = await this.findById(expenseId);

    const card = await this.cardsService.findById(expense.cardId);
    if (card.groupId !== groupId) throw new BadRequestException('Expense does not belong to this group');

    await this.runInTransaction(async (repo) => {
      if (expense.installmentGroupId) {
        await repo.delete({ installmentGroupId: expense.installmentGroupId });
        return;
      }

      if (expense.recurringGroupId) {
        await repo.delete({
          recurringGroupId: expense.recurringGroupId,
          recurringCurrentMonth: MoreThanOrEqual(expense.recurringCurrentMonth),
        });
        return;
      }

      if (expense.splitGroupId) {
        await repo.delete({ splitGroupId: expense.splitGroupId });
        return;
      }

      await repo.remove(expense);
    });
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

    const splits = dto.splits!;
    return this.runInTransaction(async (repo) => {
      const splitGroupId = uuidv4();
      const expenses = splits.map((split) =>
        repo.create({
          cardId,
          userId: split.userId,
          concept,
          amount: split.amount,
          transactionDate,
          isSplit: true,
          splitGroupId,
        }),
      );

      const created = await repo.save(expenses);

      await repo.remove(originalExpense);

      return this.findById(created[0].id);
    });
  }

  private roundAmount(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
