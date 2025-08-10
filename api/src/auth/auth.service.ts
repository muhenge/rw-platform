import {
  Inject,
  Injectable,
  BadRequestException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ClerkClient } from '@clerk/backend';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { Role, User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: DatabaseService,
    private jwtService: JwtService,
    @Inject('ClerkClient') private readonly clerkClient: ClerkClient,
    private readonly userService: UserService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<{
    user: Omit<User, 'password' | 'isActive' | 'lastLogin' | 'metadata'>;
    access_token: string;
  }> {
    // Check if user already exists
    const existing = await this.prisma.user.findFirst({
      where: { email: createUserDto.email },
    });
    if (existing) throw new BadRequestException('User already registered.');

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        avatarUrl: createUserDto.avatarUrl,
        phoneNumber: createUserDto.phoneNumber,
        role: createUserDto.role || Role.USER,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // Don't include password in response
      },
    });

    // Generate JWT token
    const payload = { email: user.email, sub: user.id };
    const access_token = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    return { user, access_token };
  }

  async login(credentials: LoginDto) {
    Logger.log('starting');
    try {
      Logger.log('in try');
      const user = await this.userService.validateUserByEmail(
        credentials.email,
        credentials.password,
      );
      Logger.log('user ----------> ', user);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload = {
        sub: user.id,
        email: user.email,
      };

      return {
        access_token: this.jwtService.sign(payload, {
          expiresIn: '7d',
        }),
        user,
      };
    } catch (error) {
      throw new BadRequestException('Login failed');
    }
  }
}
