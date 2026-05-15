import {
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards,
} from '@nestjs/common';
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GroupMemberGuard } from '../../common/guards/group-member.guard';
import { GroupOwnerGuard } from '../../common/guards/group-owner.guard';

@Controller('groups/:groupId/cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @UseGuards(JwtAuthGuard, GroupMemberGuard, GroupOwnerGuard)
  @Post()
  create(@Param('groupId') groupId: string, @Body() dto: CreateCardDto) {
    return this.cardsService.create(groupId, dto);
  }

  @UseGuards(JwtAuthGuard, GroupMemberGuard)
  @Get()
  findAll(@Param('groupId') groupId: string) {
    return this.cardsService.findByGroup(groupId);
  }

  @UseGuards(JwtAuthGuard, GroupMemberGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cardsService.findById(id);
  }

  @UseGuards(JwtAuthGuard, GroupMemberGuard, GroupOwnerGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCardDto) {
    return this.cardsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, GroupMemberGuard, GroupOwnerGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cardsService.delete(id);
  }
}
