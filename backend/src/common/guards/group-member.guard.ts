import {
  CanActivate, ExecutionContext, Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupMember } from '../../modules/groups/group-member.entity';
import { MemberStatus } from '../enums';

@Injectable()
export class GroupMemberGuard implements CanActivate {
  constructor(
    @InjectRepository(GroupMember)
    private readonly groupMemberRepository: Repository<GroupMember>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const groupId = request.params.groupId;

    const membership = await this.groupMemberRepository.findOne({
      where: { groupId, userId: user.id, status: MemberStatus.APPROVED },
    });

    if (!membership) {
      throw new ForbiddenException('You are not an approved member of this group');
    }

    request.groupMember = membership;
    return true;
  }
}
