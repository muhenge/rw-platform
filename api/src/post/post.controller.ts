import {
  Controller,
  UseGuards,
  Post,
  Body,
  Get,
  Query,
  Param,
  Delete,
  Patch,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PostService } from './post.service';
import { UserService } from 'src/user/user.service';
import { GetAuthUser } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guards';
import { User } from '@prisma/client';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

@Controller('post')
export class PostController {
  constructor(
    private readonly userService: UserService,
    private readonly postService: PostService,
  ) {}

  @UseGuards(JwtGuard)
  @Post('projects')
  async create(@GetAuthUser() user: User, @Body() data: CreateProjectDto) {
    return this.postService.createProject(user.id, data);
  }

  @UseGuards(JwtGuard)
  @Post('tasks/:projectId')
  async createTask(
    @GetAuthUser() user: User,
    @Param('projectId') projectId: string,
    @Body() data: Omit<CreateTaskDto, 'projectId'>,
  ) {
    return this.postService.createTask(user.id, { ...data, projectId });
  }

  @UseGuards(JwtGuard)
  @Get('users-with-projects')
  async findAllUsersWithProjects(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    // Convert query params to numbers and validate
    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.min(100, Math.max(1, Number(limit) || 10));

    return this.postService.findAllUsersWithProjects(pageNumber, limitNumber);
  }

  @UseGuards(JwtGuard)
  @Get('projects/all')
  async getAllProjects(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search: string = '',
  ) {
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    return this.postService.getAllProjects(pageNumber, limitNumber, search);
  }

  @UseGuards(JwtGuard)
  @Get('tasks/:projectId')
  async getTasks(
    @Param('projectId') projectId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.min(100, Math.max(1, Number(limit) || 10));

    return this.postService.getTasks(projectId, pageNumber, limitNumber);
  }

  @UseGuards(JwtGuard)
  @Get('tasks')
  async getAllTasks(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: string,
    @Query('projectId') projectId?: string,
    @Query('assigneeId') assigneeId?: string,
  ) {
    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.min(100, Math.max(1, Number(limit) || 10));

    // Validate status against allowed values
    let validatedStatus: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | undefined;
    if (status) {
      const validStatuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
      if (!validStatuses.includes(status)) {
        throw new BadRequestException(
          `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        );
      }
      validatedStatus = status as 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
    }

    return this.postService.getAllTasks({
      page: pageNumber,
      limit: limitNumber,
      status: validatedStatus,
      projectId,
      assigneeId,
    });
  }

  @UseGuards(JwtGuard)
  @Get('projects/with-progress')
  async getAllProjectsWithProgress(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search = '',
    @Query('assigneeId') assigneeId?: string,
    @Query('clientId') clientId?: string,
    @Query('status') status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE',
  ) {
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    return this.postService.getAllProjectsWithProgress({
      page: pageNumber,
      limit: limitNumber,
      search,
      assigneeId,
      clientId,
      status,
    });
  }

  @UseGuards(JwtGuard)
  @Get('projects/:projectId/my-tasks')
  async getMyProjectTasks(
    @GetAuthUser() user: User,
    @Param('projectId') projectId: string,
    @Query('status') status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE',
  ) {
    // Validate project exists and user has access
    const project = await this.postService.getProjectWithMembers(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if user is a member of the project
    const isMember = project.members.some((member) => member.id === user.id);
    if (!isMember) {
      throw new ForbiddenException('You do not have access to this project');
    }

    const tasks = await this.postService.getUserProjectTasks(
      user.id,
      projectId,
      status,
    );

    return { data: tasks };
  }

  @UseGuards(JwtGuard)
  @Get('users/:userId/projects')
  async getUserProjects(
    @Param('userId') userId: string,
    @GetAuthUser() user: User,
  ) {
    // Users can only view their own projects
    if (userId !== user.id) {
      throw new ForbiddenException('You can only view your own projects');
    }

    const projects = await this.postService.getUserProjects(userId);
    return {
      data: projects,
      meta: {
        count: projects.length,
      },
    };
  }

  @UseGuards(JwtGuard)
  @Patch('tasks/:taskId')
  async updateTask(
    @GetAuthUser() user: User,
    @Param('taskId') taskId: string,
    @Body() data: UpdateTaskDto,
  ) {
    return this.postService.updateTask(user.id, taskId, data);
  }

  @UseGuards(JwtGuard)
  @Delete('tasks/:taskId')
  async deleteTask(@GetAuthUser() user: User, @Param('taskId') taskId: string) {
    return this.postService.deleteTask(user.id, taskId);
  }

  // Comment endpoints
  @UseGuards(JwtGuard)
  @Post('comments')
  async createComment(
    @GetAuthUser() user: User,
    @Body() data: { taskId: string; content: string },
  ) {
    if (!data.taskId || !data.content) {
      throw new BadRequestException('Task ID and content are required');
    }
    return this.postService.createComment(user.id, data.taskId, data.content);
  }

  @UseGuards(JwtGuard)
  @Get('tasks/:taskId/comments')
  async getTaskComments(
    @GetAuthUser() user: User,
    @Param('taskId') taskId: string,
  ) {
    if (!taskId) {
      throw new BadRequestException('Task ID is required');
    }
    return this.postService.getTaskComments(user.id, taskId);
  }

  @UseGuards(JwtGuard)
  @Patch('comments/:commentId')
  async updateComment(
    @GetAuthUser() user: User,
    @Param('commentId') commentId: string,
    @Body() data: { content: string },
  ) {
    if (!commentId || !data?.content) {
      throw new BadRequestException('Comment ID and content are required');
    }
    return this.postService.updateComment(user.id, commentId, data.content);
  }

  @UseGuards(JwtGuard)
  @Delete('comments/:commentId')
  async deleteComment(
    @GetAuthUser() user: User,
    @Param('commentId') commentId: string,
  ) {
    if (!commentId) {
      throw new BadRequestException('Comment ID is required');
    }
    return this.postService.deleteComment(user.id, commentId);
  }
}
