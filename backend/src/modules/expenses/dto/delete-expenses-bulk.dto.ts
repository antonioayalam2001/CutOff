import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';

export class DeleteExpensesBulkDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids: string[];
}
