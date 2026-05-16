import { IsString, IsOptional, IsNumber, IsDateString, IsBoolean, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ExpenseSplitDto } from './create-expense.dto';

export class UpdateExpenseDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  concept?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsDateString()
  transactionDate?: string;

  @IsOptional()
  @IsString()
  cardId?: string;

  @IsOptional()
  @IsBoolean()
  isSplit?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(2)
  @Type(() => ExpenseSplitDto)
  splits?: ExpenseSplitDto[];
}
