import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task } from '../entities/task.entity';
import { AuditService } from '../audit/audit.service';
import { CreateTaskDto, UpdateTaskDto } from './dto';
import { JwtPayloadDto, Role } from '@org/data';

describe('TasksService', () => {
  let service: TasksService;
  let repository: jest.Mocked<Repository<Task>>;
  let auditService: jest.Mocked<AuditService>;

  const mockUser: JwtPayloadDto = {
    sub: 'user-1',
    email: 'test@example.com',
    organizationId: 'org-1',
    role: 'admin',
  };

  const mockTask: Task = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test Description',
    status: 'todo',
    priority: 'medium',
    category: 'development',
    organizationId: 'org-1',
    createdById: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    organization: null as any,
    createdBy: null as any,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    repository = module.get(getRepositoryToken(Task));
    auditService = module.get(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createTaskDto: CreateTaskDto = {
      title: 'New Task',
      description: 'Task Description',
      status: 'todo',
      priority: 'high',
      category: 'development',
    };

    it('should create a new task', async () => {
      repository.create.mockReturnValue(mockTask);
      repository.save.mockResolvedValue(mockTask);
      auditService.log.mockResolvedValue({} as any);

      const result = await service.create(createTaskDto, mockUser);

      expect(result).toEqual(mockTask);
      expect(repository.create).toHaveBeenCalledWith({
        ...createTaskDto,
        createdById: mockUser.sub,
        organizationId: mockUser.organizationId,
        status: 'todo',
      });
      expect(repository.save).toHaveBeenCalledWith(mockTask);
      expect(auditService.log).toHaveBeenCalledWith(
        mockUser.sub,
        mockUser.organizationId,
        'CREATE',
        'task',
        mockTask.id,
        expect.any(Object),
        null,
        expect.any(Object)
      );
    });

    it('should set default status if not provided', async () => {
      const dtoWithoutStatus = { ...createTaskDto, status: undefined };
      repository.create.mockReturnValue(mockTask);
      repository.save.mockResolvedValue(mockTask);
      auditService.log.mockResolvedValue({} as any);

      await service.create(dtoWithoutStatus as any, mockUser);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'todo',
        })
      );
    });
  });

  describe('findAll', () => {
    it('should return all tasks for user organization', async () => {
      const mockTasks = [mockTask];
      repository.find.mockResolvedValue(mockTasks);

      const result = await service.findAll(mockUser);

      expect(result).toEqual(mockTasks);
      expect(repository.find).toHaveBeenCalledWith({
        where: { organizationId: mockUser.organizationId },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when no tasks exist', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findAll(mockUser);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      repository.findOne.mockResolvedValue(mockTask);

      const result = await service.findOne('task-1', mockUser);

      expect(result).toEqual(mockTask);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'task-1', organizationId: mockUser.organizationId },
      });
    });

    it('should throw NotFoundException when task not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent', mockUser)).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent', mockUser)).rejects.toThrow('Task not found');
    });

    it('should not return tasks from other organizations', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('task-1', mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateTaskDto: UpdateTaskDto = {
      title: 'Updated Task',
      status: 'in-progress',
    };

    it('should update a task', async () => {
      const updatedTask = { ...mockTask, ...updateTaskDto };
      repository.findOne.mockResolvedValue(mockTask);
      repository.save.mockResolvedValue(updatedTask);
      auditService.log.mockResolvedValue({} as any);

      const result = await service.update('task-1', updateTaskDto, mockUser);

      expect(result).toEqual(updatedTask);
      expect(repository.save).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        mockUser.sub,
        mockUser.organizationId,
        'UPDATE',
        'task',
        mockTask.id,
        updateTaskDto,
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should throw NotFoundException when task not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent', updateTaskDto, mockUser)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ForbiddenException when user lacks permission', async () => {
      const viewerUser = { ...mockUser, role: 'viewer' };
      repository.findOne.mockResolvedValue(mockTask);

      await expect(service.update('task-1', updateTaskDto, viewerUser)).rejects.toThrow(
        ForbiddenException
      );
      await expect(service.update('task-1', updateTaskDto, viewerUser)).rejects.toThrow(
        'Insufficient permissions to update task'
      );
    });

    it('should allow ADMIN to update tasks', async () => {
      const updatedTask = { ...mockTask, ...updateTaskDto };
      repository.findOne.mockResolvedValue(mockTask);
      repository.save.mockResolvedValue(updatedTask);
      auditService.log.mockResolvedValue({} as any);

      const result = await service.update('task-1', updateTaskDto, mockUser);

      expect(result).toEqual(updatedTask);
    });

    it('should allow OWNER to update tasks', async () => {
      const ownerUser = { ...mockUser, role: 'owner' };
      const updatedTask = { ...mockTask, ...updateTaskDto };
      repository.findOne.mockResolvedValue(mockTask);
      repository.save.mockResolvedValue(updatedTask);
      auditService.log.mockResolvedValue({} as any);

      const result = await service.update('task-1', updateTaskDto, ownerUser);

      expect(result).toEqual(updatedTask);
    });
  });

  describe('remove', () => {
    it('should delete a task', async () => {
      repository.findOne.mockResolvedValue(mockTask);
      repository.remove.mockResolvedValue(mockTask);
      auditService.log.mockResolvedValue({} as any);

      await service.remove('task-1', mockUser);

      expect(repository.remove).toHaveBeenCalledWith(mockTask);
      expect(auditService.log).toHaveBeenCalledWith(
        mockUser.sub,
        mockUser.organizationId,
        'DELETE',
        'task',
        'task-1',
        expect.any(Object),
        expect.any(Object),
        null
      );
    });

    it('should throw NotFoundException when task not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent', mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user lacks permission', async () => {
      const viewerUser = { ...mockUser, role: 'viewer' };
      repository.findOne.mockResolvedValue(mockTask);

      await expect(service.remove('task-1', viewerUser)).rejects.toThrow(ForbiddenException);
      await expect(service.remove('task-1', viewerUser)).rejects.toThrow(
        'Insufficient permissions to delete task'
      );
    });

    it('should allow ADMIN to delete tasks', async () => {
      repository.findOne.mockResolvedValue(mockTask);
      repository.remove.mockResolvedValue(mockTask);
      auditService.log.mockResolvedValue({} as any);

      await service.remove('task-1', mockUser);

      expect(repository.remove).toHaveBeenCalledWith(mockTask);
    });
  });
});
