import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GroupMemberGuard } from '../../common/guards/group-member.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('groups/:groupId/billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @UseGuards(JwtAuthGuard, GroupMemberGuard)
  @Get()
  getSummary(
    @Param('groupId') groupId: string,
    @CurrentUser('id') userId: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const refYear = year ? parseInt(year, 10) : undefined;
    const refMonth = month ? parseInt(month, 10) : undefined;
    return this.billingService.getSummary(groupId, userId, refYear, refMonth);
  }
}
