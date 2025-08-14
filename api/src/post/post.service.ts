import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PostService {
  constructor(private prisma: DatabaseService) {}

  private generateProjectCode(name: string): string {
    const initials = name
      .split(/\s+/) // split on spaces
      .map((word) => word[0].toUpperCase())
      .join('');
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `${initials}-${datePart}`;
  }

  async createProject(userId: string, dto: CreateProjectDto) {
    // 1. Check user role
    const adminUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!adminUser || adminUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can create projects');
    }

    // 2. Validate client
    const client = await this.prisma.client.findUnique({
      where: { id: dto.clientId },
    });
    if (!client) {
      throw new NotFoundException('Client not found');
    }

    // 3. Validate member IDs
    let membersToAssign = dto.memberIds || [];
    if (membersToAssign.length > 0) {
      const users = await this.prisma.user.findMany({
        where: { id: { in: membersToAssign } },
      });
      if (users.length !== membersToAssign.length) {
        throw new NotFoundException('One or more assigned users not found');
      }
    }
    if (!membersToAssign.includes(userId)) {
      membersToAssign.push(userId);
    }

    // 4. Auto-generate unique project code
    let projectCode = this.generateProjectCode(dto.name);

    // Ensure code is unique by checking DB
    let duplicate = await this.prisma.project.findUnique({
      where: { code: projectCode },
    });
    if (duplicate) {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      projectCode = `${projectCode}-${randomNum}`;
    }

    // 5. Create project
    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        code: projectCode,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        budget: dto.budget,
        clientId: dto.clientId,
        members: {
          connect: membersToAssign.map((id) => ({ id })),
        },
      },
      include: {
        members: true,
        client: true,
      },
    });

    return project;
  }

  async findAllUsersWithProjects(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        include: {
          projects: {
            select: {
              id: true,
              name: true,
              code: true,
              startDate: true,
              endDate: true,
              status: true,
            },
          },
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

  async getAllProjects(
    page: number = 1,
    limit: number = 10,
    search: string = '',
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
            { code: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
            },
          },
          members: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: projects,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createTask(userId: string, dto: CreateTaskDto) {
    // 1. Verify the project exists and user has access
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
      include: { members: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // 2. Verify all assignees are project members
    if (dto.assigneeIds && dto.assigneeIds.length > 0) {
      const projectMemberIds = project.members.map((member) => member.id);
      const invalidAssignees = dto.assigneeIds.filter(
        (id) => !projectMemberIds.includes(id),
      );

      if (invalidAssignees.length > 0) {
        throw new BadRequestException(
          `One or more assignees are not project members: ${invalidAssignees.join(', ')}`,
        );
      }
    }

    // 3. Verify parent task exists if specified
    if (dto.parentTaskId) {
      const parentTask = await this.prisma.task.findUnique({
        where: { id: dto.parentTaskId },
        select: { projectId: true },
      });

      if (!parentTask || parentTask.projectId !== dto.projectId) {
        throw new BadRequestException('Invalid parent task');
      }
    }

    // 4. Create the task
    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status || 'TODO',
        priority: dto.priority || 2,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        projectId: dto.projectId,
        createdById: userId,
        parentTaskId: dto.parentTaskId || null,
        assignees:
          dto.assigneeIds && dto.assigneeIds.length > 0
            ? {
                connect: dto.assigneeIds.map((id) => ({ id })),
              }
            : undefined,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        assignees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return task;
  }

  async getTasks(projectId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where: { projectId },
        include: {
          assignees: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc', // This will show the latest tasks first
        },
        skip,
        take: limit,
      }),
      this.prisma.task.count({ where: { projectId } }),
    ]);

    return {
      data: tasks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAllTasks({
    page = 1,
    limit = 10,
    status,
    projectId,
    assigneeId,
  }: {
    page: number;
    limit: number;
    status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
    projectId?: string;
    assigneeId?: string;
  }) {
    const skip = (page - 1) * limit;
    const where: Prisma.TaskWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    if (assigneeId) {
      where.assignees = {
        some: {
          id: assigneeId,
        },
      };
    }

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          assignees: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data: tasks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserProjectTasks(
    userId: string,
    projectId: string,
    status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE',
  ) {
    const where: Prisma.TaskWhereInput = {
      projectId,
      assignees: {
        some: { id: userId },
      },
    };

    if (status) {
      where.status = status;
    }

    const tasks = await this.prisma.task.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        assignees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    });

    return tasks;
  }

  async getProjectWithMembers(projectId: string) {
    return this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async updateTask(userId: string, taskId: string, dto: UpdateTaskDto) {
    // Verify task exists and user has permission
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: { members: true },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: {
        assignees: true,
        createdBy: true,
        project: true,
      },
    });
  }

  async deleteTask(userId: string, taskId: string) {
    // Verify task exists and user has permission
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: { members: true },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Optionally: Add permission check here if needed
    // For example, only allow task creator or project admin to delete

    return this.prisma.task.delete({
      where: { id: taskId },
    });
  }

  async getUserProjects(userId: string) {
    return this.prisma.project.findMany({
      where: {
        members: {
          some: {
            id: userId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        code: true,
        status: true,
        startDate: true,
        endDate: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            tasks: {
              where: {
                assignees: {
                  some: { id: userId },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getAllProjectsWithProgress({
    page = 1,
    limit = 10,
    search = '',
    assigneeId,
    clientId,
    status,
  }: {
    page?: number;
    limit?: number;
    search?: string;
    assigneeId?: string;
    clientId?: string;
    status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  }) {
    const skip = (page - 1) * limit;

    // Build the where clause for filtering
    const where: Prisma.ProjectWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(clientId && { clientId }),
      ...(assigneeId || status
        ? {
            tasks: {
              ...(assigneeId && {
                some: { assignees: { some: { id: assigneeId } } },
              }),
              ...(status && { some: { status } }),
            },
          }
        : {}),
    };

    // Get total count for pagination
    const total = await this.prisma.project.count({ where });

    // Get paginated projects with tasks and related data
    const projects = await this.prisma.project.findMany({
      where,
      include: {
        tasks: {
          include: {
            assignees: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            comments: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
          orderBy: {
            dueDate: 'asc',
          },
          ...(status && { where: { status } }),
        },
        members: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Calculate progress for each project
    const data = projects.map((project) => {
      const tasks = project.tasks || [];
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(
        (task) => task.status === 'DONE',
      ).length;
      const progress =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        ...project,
        progress,
        totalTasks,
        completedTasks,
        pendingTasks: totalTasks - completedTasks,
        tasks: tasks.map((task) => ({
          ...task,
          assignee: task.assignees?.[0] || null,
        })),
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateProject(
    userId: string,
    projectId: string,
    dto: UpdateProjectDto,
  ) {
    // 1. Check if project exists and user has permission
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // 2. Check if user is an admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can update projects');
    }

    // 3. Validate client if clientId is being updated
    if (dto.clientId) {
      const client = await this.prisma.client.findUnique({
        where: { id: dto.clientId },
      });
      if (!client) {
        throw new NotFoundException('Client not found');
      }
    }

    // 4. Validate member IDs if being updated
    let membersToAssign = dto.memberIds || [];
    if (membersToAssign.length > 0) {
      const users = await this.prisma.user.findMany({
        where: { id: { in: membersToAssign } },
      });
      if (users.length !== membersToAssign.length) {
        throw new NotFoundException('One or more assigned users not found');
      }
    }

    // 5. Prepare update data
    const updateData: any = {
      name: dto.name,
      description: dto.description,
      clientId: dto.clientId,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      budget: dto.budget,
    };

    // 6. Update project
    const updatedProject = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        ...updateData,
        ...(membersToAssign.length > 0 && {
          members: {
            set: membersToAssign.map((id) => ({ id })),
          },
        }),
      },
      include: {
        members: true,
        client: true,
      },
    });

    return updatedProject;
  }

  async deleteProject(userId: string, projectId: string) {
    // 1. Check if project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // 2. Check if user is an admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can delete projects');
    }

    // 3. Use a transaction to handle related data
    return this.prisma.$transaction(async (tx) => {
      // Delete related tasks and their comments first
      await tx.comment.deleteMany({
        where: {
          task: {
            projectId: projectId,
          },
        },
      });

      await tx.task.deleteMany({
        where: {
          projectId: projectId,
        },
      });

      // Finally, delete the project
      return tx.project.delete({
        where: { id: projectId },
      });
    });
  }

  async findOneProject(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: true,
        members: true,
        tasks: {
          include: {
            assignees: true,
            createdBy: true,
            comments: {
              include: {
                user: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  // Comment methods
  async createComment(userId: string, taskId: string, content: string) {
    // Verify task exists
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Verify user has access to the task
    const hasAccess = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { project: { members: { some: { id: userId } } } },
          { assignees: { some: { id: userId } } },
        ],
      },
    });

    if (!hasAccess) {
      throw new ForbiddenException(
        'You do not have permission to comment on this task',
      );
    }

    return this.prisma.comment.create({
      data: {
        content,
        task: { connect: { id: taskId } },
        user: { connect: { id: userId } },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async getTaskComments(userId: string, taskId: string) {
    // Verify task exists and user has access
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { project: { members: { some: { id: userId } } } },
          { assignees: { some: { id: userId } } },
        ],
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found or access denied');
    }

    return this.prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async updateComment(userId: string, commentId: string, content: string) {
    // Find the comment and verify ownership
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        task: {
          select: {
            project: {
              select: {
                members: {
                  where: { id: userId },
                },
              },
            },
            assignees: {
              where: { id: userId },
            },
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Only the comment creator, project admin, or task assignee can update
    const canUpdate =
      comment.userId === userId ||
      comment.task.project.members.length > 0 ||
      comment.task.assignees.length > 0;

    if (!canUpdate) {
      throw new ForbiddenException(
        'You do not have permission to update this comment',
      );
    }

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async deleteComment(userId: string, commentId: string) {
    // Find the comment and verify ownership/access
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        user: true,
        task: {
          select: {
            project: {
              select: {
                members: {
                  where: { id: userId },
                },
              },
            },
            assignees: {
              where: { id: userId },
            },
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Only the comment creator, project admin, or task assignee can delete
    const canDelete =
      comment.userId === userId ||
      comment.task.project.members.length > 0 ||
      comment.task.assignees.length > 0;

    if (!canDelete) {
      throw new ForbiddenException(
        'You do not have permission to delete this comment',
      );
    }

    return this.prisma.comment.delete({
      where: { id: commentId },
    });
  }
}
