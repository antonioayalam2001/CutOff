import {
  CanActivate, ExecutionContext, Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from '../../modules/groups/group.entity';

@Injectable()
export class GroupOwnerGuard implements CanActivate {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const groupId = request.params.groupId;

    const group = await this.groupRepository.findOne({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.ownerId !== user.id) {
      throw new ForbiddenException('Only the group owner can perform this action');
    }

    request.group = group;
    return true;
  }
}
