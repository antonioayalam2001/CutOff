import { IsEnum } from 'class-validator';
import { MemberStatus } from '../../../common/enums';

export class UpdateMemberStatusDto {
  @IsEnum(MemberStatus)
  status: MemberStatus.APPROVED | MemberStatus.REJECTED;
}
