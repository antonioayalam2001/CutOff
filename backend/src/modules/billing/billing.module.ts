import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { GroupsModule } from '../groups/groups.module';
import { CardsModule } from '../cards/cards.module';
import { ExpensesModule } from '../expenses/expenses.module';

@Module({
  imports: [GroupsModule, CardsModule, ExpensesModule],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
