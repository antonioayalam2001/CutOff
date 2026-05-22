import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string, includePassword = false): Promise<User | null> {
    if (includePassword) {
      return this.userRepository
        .createQueryBuilder('user')
        .addSelect('user.password')
        .where('user.email = :email', { email })
        .getOne();
    }
    return this.userRepository.findOne({ where: { email } });
  }

  async create(name: string, email: string, password: string): Promise<User> {
    const user = this.userRepository.create({ name, email, password });
    return this.userRepository.save(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (dto.email && dto.email !== user.email) {
      const existing = await this.findByEmail(dto.email);
      if (existing) throw new ConflictException('Email already registered');
    }
    Object.assign(user, dto);
    await this.userRepository.save(user);
    return this.findById(id);
  }

  async updatePassword(id: string, password: string): Promise<User> {
    const user = await this.findById(id);
    user.password = password;
    await this.userRepository.save(user);
    return this.findById(id);
  }

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<User> {
    const user = await this.findByEmail((await this.findById(id)).email, true);
    if (!user?.password) throw new NotFoundException('User not found');

    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) throw new UnauthorizedException('La contraseña actual no es correcta');

    user.password = newPassword;
    await this.userRepository.save(user);
    return this.findById(id);
  }
}
