import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card } from './card.entity';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

@Injectable()
export class CardsService {
  constructor(
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
  ) {}

  async create(groupId: string, dto: CreateCardDto): Promise<Card> {
    this.validateDays(dto.cutOffDay, dto.paymentDeadlineDay);
    const card = this.cardRepository.create({ ...dto, groupId });
    return this.cardRepository.save(card);
  }

  async findByGroup(groupId: string): Promise<Card[]> {
    return this.cardRepository.find({ where: { groupId } });
  }

  async findById(id: string): Promise<Card> {
    const card = await this.cardRepository.findOne({ where: { id } });
    if (!card) throw new NotFoundException('Card not found');
    return card;
  }

  async update(id: string, dto: UpdateCardDto): Promise<Card> {
    const card = await this.findById(id);
    if (dto.cutOffDay && dto.paymentDeadlineDay) {
      this.validateDays(dto.cutOffDay, dto.paymentDeadlineDay);
    } else if (dto.cutOffDay) {
      this.validateDays(dto.cutOffDay, card.paymentDeadlineDay);
    } else if (dto.paymentDeadlineDay) {
      this.validateDays(card.cutOffDay, dto.paymentDeadlineDay);
    }
    Object.assign(card, dto);
    return this.cardRepository.save(card);
  }

  async delete(id: string): Promise<void> {
    const result = await this.cardRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Card not found');
  }

  private validateDays(cutOffDay: number, paymentDeadlineDay: number): void {
    if (cutOffDay === paymentDeadlineDay) {
      throw new BadRequestException(
        'cutOffDay and paymentDeadlineDay must be different',
      );
    }
  }
}
