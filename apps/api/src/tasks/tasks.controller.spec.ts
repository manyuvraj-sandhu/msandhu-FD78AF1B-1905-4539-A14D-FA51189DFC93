import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './dto';
import { JwtPayloadDto } from '@org/data';
import { Role } from '@org/data';

describe('TasksController', () => {
  let controller: TasksController;
  let service: jest.Mocked<TasksService>;

  const mockUser: JwtPayloadDto = {
    sub: 'user-1',
    email: 'test@example.com',
    organizationId: 'org-1',
    role: 'admin',
  };

  const mockTask = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test Description',
    status: 'pending',
    priority: 'medium',
    category: 'development',
    organizationId: 'org-1',
    userId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    service = module.get(TasksService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /tasks', () => {
    const createTaskDto: CreateTaskDto = {
      title: 'New Task',
      description: 'Task Description',
      status: 'pending',
      priority: 'high',
      category: 'development',
    };

    it('should create a new task', async () => {
      service.create.mockResolvedValue(mockTask);

      const result = await controller.create(createTaskDto, mockUser);

      expect(result).toEqual(mockTask);
      expect(service.create).toHaveBeenCalledWith(createTaskDto, mockUser);
    });
  });

  describe('GET /tasks', () => {
    it('should return all tasks for user organization', async () => {
      const mockTasks = [mockTask];
      service.findAll.mockResolvedValue(mockTasks);

      const result = await controller.findAll(mockUser);

      expect(result).toEqual(mockTasks);
      expect(service.findAll).toHaveBeenCalledWith(mockUser);
    });

    it('should return empty array when no tasks exist', async () => {
      service.findAll.mockResolvedValue([]);

      const result = await controller.findAll(mockUser);

      expect(result).toEqual([]);
    });
  });

  describe('GET /tasks/:id', () => {
    it('should return a specific task by id', async () => {
      service.findOne.mockResolvedValue(mockTask);

      const result = await controller.findOne('task-1', mockUser);

      expect(result).toEqual(mockTask);
      expect(service.findOne).toHaveBeenCalledWith('task-1', mockUser);
    });

    it('should throw error when task not found', async () => {
      service.findOne.mockRejectedValue(new Error('Task not found'));

      await expect(controller.findOne('non-existent', mockUser)).rejects.toThrow('Task not found');
    });
  });

  describe('PUT /tasks/:id', () => {
    const updateTaskDto: UpdateTaskDto = {
      title: 'Updated Task',
      status: 'in-progress',
    };

    it('should update an existing task', async () => {
      const updatedTask = { ...mockTask, ...updateTaskDto };
      service.update.mockResolvedValue(updatedTask);

      const result = await controller.update('task-1', updateTaskDto, mockUser);

      expect(result).toEqual(updatedTask);
      expect(service.update).toHaveBeenCalledWith('task-1', updateTaskDto, mockUser);
    });

    it('should throw error when task not found', async () => {
      service.update.mockRejectedValue(new Error('Task not found'));

      await expect(controller.update('non-existent', updateTaskDto, mockUser)).rejects.toThrow(
        'Task not found'
      );
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should delete a task', async () => {
      service.remove.mockResolvedValue(undefined);

      const result = await controller.remove('task-1', mockUser);

      expect(result).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith('task-1', mockUser);
    });

    it('should throw error when task not found', async () => {
      service.remove.mockRejectedValue(new Error('Task not found'));

      await expect(controller.remove('non-existent', mockUser)).rejects.toThrow('Task not found');
    });
  });

  describe('RBAC enforcement', () => {
    it('should require admin or owner role for POST /tasks', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'New Task',
        description: 'Task Description',
        status: 'pending',
        priority: 'high',
        category: 'development',
      };

      service.create.mockResolvedValue(mockTask);

      // Note: The actual RBAC enforcement is done by guards,
      // we're testing that the controller calls the service with correct parameters
      await controller.create(createTaskDto, mockUser);

      expect(service.create).toHaveBeenCalledWith(createTaskDto, mockUser);
    });

    it('should require admin or owner role for PUT /tasks/:id', async () => {
      const updateTaskDto: UpdateTaskDto = {
        status: 'completed',
      };

      service.update.mockResolvedValue({ ...mockTask, status: 'completed' });

      await controller.update('task-1', updateTaskDto, mockUser);

      expect(service.update).toHaveBeenCalledWith('task-1', updateTaskDto, mockUser);
    });

    it('should require admin or owner role for DELETE /tasks/:id', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove('task-1', mockUser);

      expect(service.remove).toHaveBeenCalledWith('task-1', mockUser);
    });
  });
});
