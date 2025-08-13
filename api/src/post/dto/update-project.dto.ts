import {
  IsString,
  IsOptional,
  IsArray,
  IsDateString,
  IsNumber,
} from 'class-validator';

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  clientId?: string;

  @IsDateString()
  @IsOptional()
  startDate?: Date;

  @IsDateString()
  @IsOptional()
  endDate?: Date;

  @IsNumber()
  @IsOptional()
  budget?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  memberIds?: string[];
}
