import { IsString, Length } from 'class-validator';

export class JoinGroupDto {
  @IsString()
  @Length(8, 8)
  inviteCode: string;
}
