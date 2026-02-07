import { IsString, IsOptional, IsEnum } from 'class-validator';
import { TaskStatus } from '../../entities/task.entity';

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['todo', 'in_progress', 'done'])
  @IsOptional()
  status?: TaskStatus;

  @IsString()
  @IsOptional()
  category?: string;
}
