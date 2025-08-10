import {
  Controller,
  Get,
  Req,
  Query,
  UseGuards,
  Inject,
  NotFoundException,
  Post,
  Body,
  ForbiddenException,
} from '@nestjs/common';
//import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { UserService } from './user.service';
// import { ClerkClient } from '@clerk/backend';
// import { CurrentUserResponse } from './user.service';
import { GetAuthUser } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guards';
import { User, Prisma, Role } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { CreateClientDto } from './dto/create-client.dto';
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private prisma: DatabaseService,
    //@Inject('ClerkClient') private readonly clerkClient: ClerkClient,
  ) {}

  @UseGuards(JwtGuard)
  @Get('me')
  async getMe(@GetAuthUser() user: User) {
    return this.userService.findById(user.id);
  }

  @UseGuards(JwtGuard)
  @Get('clients')
  async getClients(
    @GetAuthUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.userService.findAllClients(+page, +limit);
  }

  @UseGuards(JwtGuard)
  @Get('all')
  async getUsers(
    @GetAuthUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.userService.findAllUsers(+page, +limit);
  }

  @Get('clients/search')
  async searchClients(
    @Query('query') query?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const skip = (page - 1) * limit;

    const where = query
      ? {
          name: {
            contains: query,
            mode: Prisma.QueryMode.insensitive,
          },
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      }),
      this.prisma.client.count({ where }),
    ]);

    return {
      data: items,
      meta: { total, page, limit },
    };
  }

  @UseGuards(JwtGuard)
  @Post('clients')
  async createClient(
    @GetAuthUser() user: User,
    @Body() createClientDto: CreateClientDto,
  ) {
    // Check if user is admin
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can create clients');
    }

    return this.userService.createClient(createClientDto);
  }
}
