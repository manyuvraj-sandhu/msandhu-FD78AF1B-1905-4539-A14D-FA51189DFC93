import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { CreateTaskDto, UpdateTaskDto } from './dto';
import { JwtPayloadDto } from '@org/data';
import { canUpdateOrDeleteTask } from '@org/auth';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @Inject(forwardRef(() => AuditService))
    private auditService: AuditService,
  ) {}

  async create(
    createTaskDto: CreateTaskDto,
    user: JwtPayloadDto,
  ): Promise<Task> {
    const task = this.taskRepository.create({
      ...createTaskDto,
      createdById: user.sub,
      organizationId: user.organizationId,
      status: createTaskDto.status || 'todo',
    });

    const savedTask = await this.taskRepository.save(task);

    // Log audit entry
    await this.auditService.log(
      user.sub,
      user.organizationId,
      'CREATE',
      'task',
      savedTask.id,
      { title: savedTask.title, status: savedTask.status },
    );

    return savedTask;
  }

  async findAll(user: JwtPayloadDto): Promise<Task[]> {
    return this.taskRepository.find({
      where: { organizationId: user.organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, user: JwtPayloadDto): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id, organizationId: user.organizationId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    user: JwtPayloadDto,
  ): Promise<Task> {
    const task = await this.findOne(id, user);

    // Check permission
    if (!canUpdateOrDeleteTask(user.role)) {
      throw new ForbiddenException('Insufficient permissions to update task');
    }

    Object.assign(task, updateTaskDto);

    const updatedTask = await this.taskRepository.save(task);

    // Log audit entry
    await this.auditService.log(
      user.sub,
      user.organizationId,
      'UPDATE',
      'task',
      updatedTask.id,
      updateTaskDto,
    );

    return updatedTask;
  }

  async remove(id: string, user: JwtPayloadDto): Promise<void> {
    const task = await this.findOne(id, user);

    // Check permission
    if (!canUpdateOrDeleteTask(user.role)) {
      throw new ForbiddenException('Insufficient permissions to delete task');
    }

    await this.taskRepository.remove(task);

    // Log audit entry
    await this.auditService.log(
      user.sub,
      user.organizationId,
      'DELETE',
      'task',
      id,
      { title: task.title },
    );
  }
}
