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
      null, // no previous state for create
      { 
        title: savedTask.title, 
        status: savedTask.status, 
        priority: savedTask.priority,
        description: savedTask.description,
        category: savedTask.category
      },
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

    // Capture previous state
    const previousState = {
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      category: task.category,
    };

    Object.assign(task, updateTaskDto);

    const updatedTask = await this.taskRepository.save(task);

    // Capture new state
    const newState = {
      title: updatedTask.title,
      description: updatedTask.description,
      status: updatedTask.status,
      priority: updatedTask.priority,
      category: updatedTask.category,
    };

    // Log audit entry
    await this.auditService.log(
      user.sub,
      user.organizationId,
      'UPDATE',
      'task',
      updatedTask.id,
      updateTaskDto,
      previousState,
      newState,
    );

    return updatedTask;
  }

  async remove(id: string, user: JwtPayloadDto): Promise<void> {
    const task = await this.findOne(id, user);

    // Check permission
    if (!canUpdateOrDeleteTask(user.role)) {
      throw new ForbiddenException('Insufficient permissions to delete task');
    }

    // Capture previous state before deletion
    const previousState = {
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      category: task.category,
    };

    await this.taskRepository.remove(task);

    // Log audit entry
    await this.auditService.log(
      user.sub,
      user.organizationId,
      'DELETE',
      'task',
      id,
      { title: task.title },
      previousState,
      null, // no new state for delete
    );
  }
}
