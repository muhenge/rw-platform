import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { Logger } from '@nestjs/common';

// export interface ClerkUserPayload {
//   id: string;
//   email: string;
//   firstName?: string;
//   lastName?: string;
//   avatarUrl?: string;
//   phoneNumber?: string;
//   metadata?: any;
//   role?: Role;
//   password?: string;
// }

export interface CurrentUserResponse {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  phoneNumber?: string;
}

@Injectable()
export class UserService {
  constructor(private readonly prisma: DatabaseService) {}

  // async createFromClerk(payload: ClerkUserPayload): Promise<User> {
  //   const existing = await this.prisma.user.findFirst({
  //     where: {
  //       OR: [{ clerkId: payload.id }, { email: payload.email }],
  //     },
  //   });
  //   if (existing) return existing;
  //   return this.prisma.user.create({
  //     data: {
  //       //clerkId: payload.id,
  //       email: payload.email,
  //       firstName: payload.firstName || '',
  //       lastName: payload.lastName || '',
  //       avatarUrl: payload.avatarUrl,
  //       phoneNumber: payload.phoneNumber,
  //       //metadata: payload.metadata,
  //       role: payload.role || Role.USER,
  //       password: payload.password, // Save hashed password
  //     },
  //   });
  // }

  create = async (data: CreateUserDto) => {
    const existing = await this.prisma.user.findFirst({
      where: { email: data.email },
    });

    if (existing) throw new BadRequestException('already registered.');

    return this.prisma.user.create({
      data: {
        ...data,
      },
    });
  };

  // async findByClerkId(clerkId: string): Promise<User | null> {
  //   return this.prisma.user.findUnique({ where: { clerkId } });
  // }

  async getCurrentUser(id: string): Promise<CurrentUserResponse | null> {
    const user = await this.findById(id);

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl || undefined,
      phoneNumber: user.phoneNumber || undefined,
    };
  }

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async validateUserByEmail(
    email: string,
    password: string,
  ): Promise<Partial<User>> {
    try {
      const user = await this.findByEmail(email);
      Logger.log('User found by email:', user.email);

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      Logger.error('Email validation error:', error);
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async validateUser(id: string, pass: string): Promise<Partial<User>> {
    const user = await this.findById(id);
    Logger.log('User in user service', user);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(pass, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(`Wrong password`);
    }

    return user;
  }

  async findAllUsers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          avatarUrl: true,
          phoneNumber: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllClients(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
      this.prisma.client.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.client.count(),
    ]);

    return {
      data: clients,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createClient(createClientDto: CreateClientDto) {
    try {
      // Check if client with the same name already exists
      const existingClient = await this.prisma.client.findFirst({
        where: {
          name: createClientDto.name,
        },
      });

      if (existingClient) {
        throw new BadRequestException('Client with this name already exists');
      }

      // Create the new client
      const client = await this.prisma.client.create({
        data: {
          name: createClientDto.name,
          email: createClientDto.email,
          phone: createClientDto.phone,
          address: createClientDto.address,
        },
      });

      return client;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Client with this name already exists');
      }
      throw error;
    }
  }
}
