import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PasswordResetToken } from './entities/password-reset-token.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(PasswordResetToken)
    private readonly resetTokenRepository: Repository<PasswordResetToken>,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create(dto.name, dto.email, hashedPassword);

    const token = this.generateToken(user);
    return { user: { id: user.id, name: user.name, email: user.email }, token };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    const token = this.generateToken(user);
    return { user: { id: user.id, name: user.name, email: user.email }, token };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      return { message: 'Si el correo existe, recibirás un enlace para restablecer tu contraseña' };
    }

    const token = nanoid(48);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.resetTokenRepository.save({
      email: dto.email,
      token,
      expiresAt,
    });

    const resetUrl = `http://localhost:3000/reset-password?token=${token}`;
    console.log('═══════════════════════════════════════════════════════');
    console.log('  SOLICITUD DE RESTABLECIMIENTO DE CONTRASEÑA');
    console.log(`  Para: ${dto.email}`);
    console.log(`  Enlace: ${resetUrl}`);
    console.log(`  Válido hasta: ${expiresAt.toLocaleString()}`);
    console.log('═══════════════════════════════════════════════════════');

    return { message: 'Si el correo existe, recibirás un enlace para restablecer tu contraseña' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const resetToken = await this.resetTokenRepository.findOne({
      where: { token: dto.token, used: false },
    });

    if (!resetToken) {
      throw new BadRequestException('Token inválido o ya fue utilizado');
    }

    if (new Date() > resetToken.expiresAt) {
      throw new BadRequestException('El token ha expirado');
    }

    const user = await this.usersService.findByEmail(resetToken.email);
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    user.password = hashedPassword;
    await this.usersService.update(user.id, { password: hashedPassword } as any);

    resetToken.used = true;
    await this.resetTokenRepository.save(resetToken);

    return { message: 'Contraseña restablecida exitosamente' };
  }

  private generateToken(user: { id: string; email: string }) {
    const payload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }
}
