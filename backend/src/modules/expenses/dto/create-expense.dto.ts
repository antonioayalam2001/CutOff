import {
  IsString, IsNumber, IsDateString, IsBoolean, IsInt, Min, IsOptional, MinLength,
  IsArray, ValidateNested, ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ExpenseSplitDto {
  @IsString()
  userId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;
}

export class CreateExpenseDto {
  @IsString()
  cardId: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @MinLength(3)
  concept: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsDateString()
  transactionDate: string;

  @IsBoolean()
  @IsOptional()
  isMSI?: boolean;

  @IsInt()
  @Min(2)
  @IsOptional()
  totalInstallments?: number;

  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @IsInt()
  @Min(2)
  @IsOptional()
  recurringMonths?: number;

  @IsBoolean()
  @IsOptional()
  isSplit?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExpenseSplitDto)
  splits?: ExpenseSplitDto[];
}
