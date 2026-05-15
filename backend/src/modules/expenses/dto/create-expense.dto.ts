import {
  IsString, IsNumber, IsDateString, IsBoolean, IsInt, Min, IsOptional, MinLength,
} from 'class-validator';

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
}
