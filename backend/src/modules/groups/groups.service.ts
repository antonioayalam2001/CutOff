import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { nanoid } from 'nanoid';
import { Group } from './group.entity';
import { GroupMember } from './group-member.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import { UpdateMemberStatusDto } from './dto/update-member-status.dto';
import { MemberStatus } from '../../common/enums';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepository: Repository<GroupMember>,
  ) {}

  async create(ownerId: string, dto: CreateGroupDto): Promise<Group> {
    const inviteCode = nanoid(8).toUpperCase();
    const group = this.groupRepository.create({
      name: dto.name,
      ownerId,
      inviteCode,
    });
    const saved = await this.groupRepository.save(group);

    await this.groupMemberRepository.save({
      groupId: saved.id,
      userId: ownerId,
      status: MemberStatus.APPROVED,
    });

    return saved;
  }

  async findByUser(userId: string): Promise<Group[]> {
    const memberships = await this.groupMemberRepository.find({
      where: { userId, status: MemberStatus.APPROVED },
      relations: ['group'],
    });
    return memberships.map((m) => m.group);
  }

  async findById(id: string): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id },
      relations: ['owner'],
    });
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  async join(userId: string, dto: JoinGroupDto): Promise<GroupMember> {
    const group = await this.groupRepository.findOne({
      where: { inviteCode: dto.inviteCode },
    });
    if (!group) throw new NotFoundException('Invalid invite code');

    const existing = await this.groupMemberRepository.findOne({
      where: { groupId: group.id, userId },
    });
    if (existing) throw new ConflictException('Already a member of this group');

    if (group.ownerId === userId) {
      throw new BadRequestException('You are the owner of this group');
    }

    const member = this.groupMemberRepository.create({
      groupId: group.id,
      userId,
      status: MemberStatus.PENDING,
    });
    return this.groupMemberRepository.save(member);
  }

  async getMembers(groupId: string): Promise<GroupMember[]> {
    return this.groupMemberRepository.find({
      where: { groupId },
      relations: ['user'],
    });
  }

  async updateMemberStatus(groupId: string, memberId: string, dto: UpdateMemberStatusDto): Promise<GroupMember> {
    const member = await this.groupMemberRepository.findOne({
      where: { id: memberId, groupId },
    });
    if (!member) throw new NotFoundException('Member not found');

    if (dto.status === MemberStatus.APPROVED) {
      member.status = MemberStatus.APPROVED;
    } else if (dto.status === MemberStatus.REJECTED) {
      member.status = MemberStatus.REJECTED;
    }

    return this.groupMemberRepository.save(member);
  }

  async isOwner(groupId: string, userId: string): Promise<boolean> {
    const group = await this.groupRepository.findOne({ where: { id: groupId } });
    return group?.ownerId === userId;
  }

  async getApprovedMemberIds(groupId: string): Promise<string[]> {
    const members = await this.groupMemberRepository.find({
      where: { groupId, status: MemberStatus.APPROVED },
    });
    return members.map((m) => m.userId);
  }
}
