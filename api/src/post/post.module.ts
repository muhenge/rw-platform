import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { UserService } from '../user/user.service';
import { DatabaseService } from '../database/database.service';
import { PassportModule } from '@nestjs/passport';
@Module({
  providers: [PostService, UserService, DatabaseService, PassportModule],
  controllers: [PostController],
})
export class PostModule {}
