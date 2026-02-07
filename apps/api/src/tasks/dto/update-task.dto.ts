import { IsString, IsOptional, IsEnum } from 'class-validator';
import { TaskStatus, TaskPriority } from '../../entities/task.entity';

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

  @IsEnum(['low', 'medium', 'high', 'critical'])
  @IsOptional()
  priority?: TaskPriority;

  @IsString()
  @IsOptional()
  category?: string;
}
