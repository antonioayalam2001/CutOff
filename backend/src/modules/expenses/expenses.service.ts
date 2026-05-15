import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual, Between } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Expense } from './expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { FindAllExpensesDto } from './dto/find-all-expenses.dto';
import { GroupsService } from '../groups/groups.service';
import { CardsService } from '../cards/cards.service';
import { MemberStatus } from '../../common/enums';

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
      throw new ForbiddenException(
        'Standard users can only create expenses for themselves',
      );
    }

    if (!isOwner) {
      const members = await this.groupsService.getApprovedMemberIds(groupId);
      if (!members.includes(userId)) {
        throw new ForbiddenException('You are not an approved member');
      }
    }

    const card = await this.cardsService.findById(dto.cardId);
    if (card.groupId !== groupId) {
      throw new BadRequestException('Card does not belong to this group');
    }

    if (dto.isMSI) {
      return this.createMSIExpenses(targetUserId, dto);
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

  private async createMSIExpenses(
    userId: string,
    dto: CreateExpenseDto,
  ): Promise<Expense[]> {
    const totalInstallments = dto.totalInstallments || 2;
    if (totalInstallments < 2) {
      throw new BadRequestException('MSI requires at least 2 installments');
    }

    const installmentAmount = this.roundAmount(
      dto.amount / totalInstallments,
    );
    const remainder = this.roundAmount(
      dto.amount - installmentAmount * (totalInstallments - 1),
    );

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
  ): Promise<{ data: Expense[]; total: number; page: number; limit: number; totalPages: number }> {
    const isOwner = await this.groupsService.isOwner(groupId, userId);
    const { page, limit, dateFrom, dateTo } = query;

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

    const where = this.buildWhereClause(cardIds, memberFilter, dateFrom, dateTo);
    const [data, total] = await this.expenseRepository.findAndCount({
      where,
      relations: ['card', 'user'],
      order: { transactionDate: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  private buildWhereClause(
    cardIds: string[],
    memberFilter: Record<string, any>,
    dateFrom?: string,
    dateTo?: string,
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

    if (expense.isMSI && expense.installmentGroupId) {
      if (dto.amount !== undefined) {
        throw new BadRequestException('Cannot change amount of an MSI expense');
      }
      if (dto.cardId !== undefined) {
        throw new BadRequestException('Cannot change card of an MSI expense');
      }
      if (dto.transactionDate !== undefined) {
        throw new BadRequestException('Cannot change date of an MSI expense');
      }
    }

    if (dto.userId !== undefined) {
      const members = await this.groupsService.getApprovedMemberIds(groupId);
      if (!members.includes(dto.userId)) {
        throw new BadRequestException('Target user is not an approved member');
      }
    }

    if (dto.cardId !== undefined) {
      const newCard = await this.cardsService.findById(dto.cardId);
      if (newCard.groupId !== groupId) {
        throw new BadRequestException('Card does not belong to this group');
      }
    }

    const updateData: Partial<Expense> = {};
    if (dto.userId !== undefined) updateData.userId = dto.userId;
    if (dto.concept !== undefined) updateData.concept = dto.concept;
    if (dto.amount !== undefined) updateData.amount = dto.amount;
    if (dto.transactionDate !== undefined) updateData.transactionDate = dto.transactionDate;
    if (dto.cardId !== undefined) updateData.cardId = dto.cardId;

    if (Object.keys(updateData).length === 0) {
      return expense;
    }

    if (expense.isMSI && expense.installmentGroupId) {
      await this.expenseRepository.update(
        { installmentGroupId: expense.installmentGroupId },
        updateData,
      );
    } else {
      await this.expenseRepository.update(expenseId, updateData);
    }

    return this.expenseRepository.findOne({
      where: { id: expenseId },
      relations: ['card', 'user'],
    });
  }

  async bulkDelete(groupId: string, userId: string, ids: string[]): Promise<{ deleted: number }> {
    const isOwner = await this.groupsService.isOwner(groupId, userId);
    if (!isOwner) {
      throw new ForbiddenException('Only the group owner can delete expenses');
    }

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
    const simpleToDelete = toDelete.filter((e) => !e.isMSI || !e.installmentGroupId);
    const msiToDelete = toDelete.filter((e) => e.isMSI && e.installmentGroupId && msiGroupIds.includes(e.installmentGroupId));

    let count = 0;
    if (simpleToDelete.length > 0) {
      await this.expenseRepository.remove(simpleToDelete);
      count += simpleToDelete.length;
    }

    for (const igId of msiGroupIds) {
      const result = await this.expenseRepository.delete({ installmentGroupId: igId });
      count += result.affected || 0;
    }

    return { deleted: count };
  }

  async delete(
    groupId: string,
    expenseId: string,
    userId: string,
  ): Promise<void> {
    const isOwner = await this.groupsService.isOwner(groupId, userId);
    if (!isOwner) {
      throw new ForbiddenException('Only the group owner can delete expenses');
    }

    const expense = await this.findById(expenseId);

    const card = await this.cardsService.findById(expense.cardId);
    if (card.groupId !== groupId) {
      throw new BadRequestException('Expense does not belong to this group');
    }

    if (expense.isMSI && expense.installmentGroupId) {
      await this.expenseRepository.delete({
        installmentGroupId: expense.installmentGroupId,
      });
      return;
    }

    await this.expenseRepository.remove(expense);
  }

  private roundAmount(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
