import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { DatabaseService } from 'src/database/database.service';
import { ClerkClientProvider } from 'providers/clerk-client.provider';

@Module({
  providers: [UserService, DatabaseService, ClerkClientProvider],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
