import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { CreateExpenseBulkDto } from './dto/create-expense-bulk.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { FindAllExpensesDto } from './dto/find-all-expenses.dto';
import { DeleteExpensesBulkDto } from './dto/delete-expenses-bulk.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GroupMemberGuard } from '../../common/guards/group-member.guard';
import { GroupOwnerGuard } from '../../common/guards/group-owner.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('groups/:groupId/expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @UseGuards(JwtAuthGuard, GroupMemberGuard)
  @Post()
  create(
    @Param('groupId') groupId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateExpenseDto,
  ) {
    return this.expensesService.create(groupId, userId, dto);
  }

  @UseGuards(JwtAuthGuard, GroupMemberGuard)
  @Post('bulk')
  bulkCreate(
    @Param('groupId') groupId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateExpenseBulkDto,
  ) {
    return this.expensesService.bulkCreate(groupId, userId, dto.expenses);
  }

  @UseGuards(JwtAuthGuard, GroupMemberGuard)
  @Get()
  findAll(
    @Param('groupId') groupId: string,
    @CurrentUser('id') userId: string,
    @Query() query: FindAllExpensesDto,
  ) {
    return this.expensesService.findAll(groupId, userId, query);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expensesService.findById(id);
  }

  @UseGuards(JwtAuthGuard, GroupMemberGuard, GroupOwnerGuard)
  @Patch(':id')
  update(
    @Param('groupId') groupId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(groupId, id, userId, dto);
  }

  @UseGuards(JwtAuthGuard, GroupMemberGuard, GroupOwnerGuard)
  @Delete('bulk')
  bulkDelete(
    @Param('groupId') groupId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: DeleteExpensesBulkDto,
  ) {
    return this.expensesService.bulkDelete(groupId, userId, dto.ids);
  }

  @UseGuards(JwtAuthGuard, GroupMemberGuard, GroupOwnerGuard)
  @Delete(':id')
  delete(
    @Param('groupId') groupId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.expensesService.delete(groupId, id, userId);
  }
}
