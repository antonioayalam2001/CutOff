import { IsString, Length, IsInt, Min, Max } from 'class-validator';

export class CreateCardDto {
  @IsString()
  name: string;

  @IsString()
  @Length(4, 4)
  lastFourDigits: string;

  @IsInt()
  @Min(1)
  @Max(31)
  cutOffDay: number;

  @IsInt()
  @Min(1)
  @Max(31)
  paymentDeadlineDay: number;
}
