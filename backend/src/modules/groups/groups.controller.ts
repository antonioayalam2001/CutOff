import {
  Controller, Get, Post, Patch, Param, Body, UseGuards,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import { UpdateMemberStatusDto } from './dto/update-member-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GroupOwnerGuard } from '../../common/guards/group-owner.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateGroupDto) {
    return this.groupsService.create(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.groupsService.findByUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('join')
  join(@CurrentUser('id') userId: string, @Body() dto: JoinGroupDto) {
    return this.groupsService.join(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupsService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/members')
  getMembers(@Param('id') id: string) {
    return this.groupsService.getMembers(id);
  }

  @UseGuards(JwtAuthGuard, GroupOwnerGuard)
  @Patch(':groupId/members/:memberId/status')
  updateMemberStatus(
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberStatusDto,
  ) {
    return this.groupsService.updateMemberStatus(groupId, memberId, dto);
  }
}
