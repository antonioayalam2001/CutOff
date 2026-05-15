import { IsString, Length, IsInt, Min, Max, IsOptional } from 'class-validator';

export class UpdateCardDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @Length(4, 4)
  @IsOptional()
  lastFourDigits?: string;

  @IsInt()
  @Min(1)
  @Max(31)
  @IsOptional()
  cutOffDay?: number;

  @IsInt()
  @Min(1)
  @Max(31)
  @IsOptional()
  paymentDeadlineDay?: number;
}
