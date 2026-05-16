import { IsOptional, IsInt, Min, Max, IsDateString, IsUUID, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class FindAllExpensesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsUUID()
  cardId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
