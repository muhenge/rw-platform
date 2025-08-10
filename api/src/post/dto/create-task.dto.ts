import {
  IsString,
  IsOptional,
  IsArray,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus = 'TODO';

  @IsInt()
  @Min(1)
  @Max(3)
  @IsOptional()
  priority?: number = 2;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsUUID()
  projectId: string;

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  assigneeIds?: string[] = [];

  @IsUUID()
  @IsOptional()
  parentTaskId?: string;
}
