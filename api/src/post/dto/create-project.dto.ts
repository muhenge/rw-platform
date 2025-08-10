import {
  IsString,
  IsUUID,
  IsArray,
  IsOptional,
  IsDateString,
  IsNumber,
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  clientId: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  budget?: number;

  @IsArray()
  @IsUUID('4', { each: true })
  memberIds: string[];
}
