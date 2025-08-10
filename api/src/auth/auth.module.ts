import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt/jwt.strategy';
import { JwtGuard } from './guards/auth.guard';
import { UserModule } from '../user/user.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { DatabaseService } from 'src/database/database.service';
import { ClerkClientProvider } from 'providers/clerk-client.provider';

@Module({
  imports: [
    ConfigModule,
    UserModule,
    PassportModule.register({
      defaultStrategy: 'jwt',
      property: 'user',
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION') || '7d',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtGuard,
    DatabaseService,
    ClerkClientProvider,
    {
      provide: APP_GUARD,
      useFactory: (reflector: Reflector) => {
        return new JwtGuard(reflector);
      },
      inject: [Reflector],
    },
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
