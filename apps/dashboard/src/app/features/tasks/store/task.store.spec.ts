import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TaskStore } from './task.store';
import { TaskService } from '../../../core/services/task.service';
import { Task, CreateTaskDto, UpdateTaskDto } from '@org/data';

describe('TaskStore', () => {
  let store: TaskStore;
  let taskService: jest.Mocked<TaskService>;

  const mockTask: Task = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test Description',
    status: 'todo',
    priority: 'medium',
    category: 'development',
    organizationId: 'org-1',
    createdById: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockTask2: Task = {
    ...mockTask,
    id: 'task-2',
    title: 'Another Task',
    status: 'in-progress',
    priority: 'high',
  };

  beforeEach(() => {
    const taskServiceMock = {
      getTasks: jest.fn(),
      createTask: jest.fn(),
      updateTask: jest.fn(),
      deleteTask: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        TaskStore,
        { provide: TaskService, useValue: taskServiceMock },
      ],
    });

    store = TestBed.inject(TaskStore);
    taskService = TestBed.inject(TaskService) as jest.Mocked<TaskService>;
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should have correct initial state', (done) => {
      store.tasks$.subscribe((tasks) => {
        expect(tasks).toEqual([]);
        done();
      });
    });

    it('should have loading false initially', (done) => {
      store.loading$.subscribe((loading) => {
        expect(loading).toBe(false);
        done();
      });
    });

    it('should have no error initially', (done) => {
      store.error$.subscribe((error) => {
        expect(error).toBeNull();
        done();
      });
    });

    it('should have empty filters initially', (done) => {
      store.filters$.subscribe((filters) => {
        expect(filters).toEqual({
          status: [],
          category: [],
          searchQuery: '',
        });
        done();
      });
    });

    it('should have default sort configuration', (done) => {
      store.sortConfig$.subscribe((config) => {
        expect(config).toEqual({
          sortBy: 'createdAt',
          sortOrder: 'desc',
        });
        done();
      });
    });
  });

  describe('Selectors', () => {
    it('should emit tasks from tasks$ selector', (done) => {
      store.setTasks([mockTask]);

      store.tasks$.subscribe((tasks) => {
        expect(tasks).toEqual([mockTask]);
        done();
      });
    });

    it('should emit loading state from loading$ selector', (done) => {
      store.setLoading(true);

      store.loading$.subscribe((loading) => {
        expect(loading).toBe(true);
        done();
      });
    });

    it('should emit error from error$ selector', (done) => {
      store.setError('Test error');

      store.error$.subscribe((error) => {
        expect(error).toBe('Test error');
        done();
      });
    });
  });

  describe('Updaters', () => {
    it('should set tasks', (done) => {
      store.setTasks([mockTask, mockTask2]);

      store.tasks$.subscribe((tasks) => {
        expect(tasks).toHaveLength(2);
        expect(tasks).toContain(mockTask);
        expect(tasks).toContain(mockTask2);
        done();
      });
    });

    it('should add task', (done) => {
      store.setTasks([mockTask]);
      store.addTask(mockTask2);

      store.tasks$.subscribe((tasks) => {
        expect(tasks).toHaveLength(2);
        expect(tasks[0]).toEqual(mockTask2); // New task added at beginning
        done();
      });
    });

    it('should update task in state', (done) => {
      store.setTasks([mockTask]);
      const updatedTask = { ...mockTask, title: 'Updated Title' };
      store.updateTaskInState(updatedTask);

      store.tasks$.subscribe((tasks) => {
        expect(tasks[0].title).toBe('Updated Title');
        done();
      });
    });

    it('should remove task', (done) => {
      store.setTasks([mockTask, mockTask2]);
      store.removeTask('task-1');

      store.tasks$.subscribe((tasks) => {
        expect(tasks).toHaveLength(1);
        expect(tasks[0].id).toBe('task-2');
        done();
      });
    });

    it('should set filters', (done) => {
      store.setFilters({ status: ['todo', 'in-progress'] });

      store.filters$.subscribe((filters) => {
        expect(filters.status).toEqual(['todo', 'in-progress']);
        done();
      });
    });

    it('should set sort by', (done) => {
      store.setSortBy('title');

      store.sortConfig$.subscribe((config) => {
        expect(config.sortBy).toBe('title');
        done();
      });
    });

    it('should set sort order', (done) => {
      store.setSortOrder('asc');

      store.sortConfig$.subscribe((config) => {
        expect(config.sortOrder).toBe('asc');
        done();
      });
    });
  });

  describe('Filtered Tasks Selector', () => {
    beforeEach(() => {
      const tasks = [
        mockTask,
        mockTask2,
        { ...mockTask, id: 'task-3', title: 'Third Task', status: 'done', category: 'testing' },
      ];
      store.setTasks(tasks);
    });

    it('should filter tasks by status', (done) => {
      store.setFilters({ status: ['todo'] });

      store.filteredTasks$.subscribe((tasks) => {
        expect(tasks).toHaveLength(1);
        expect(tasks[0].status).toBe('todo');
        done();
      });
    });

    it('should filter tasks by multiple statuses', (done) => {
      store.setFilters({ status: ['todo', 'in-progress'] });

      store.filteredTasks$.subscribe((tasks) => {
        expect(tasks).toHaveLength(2);
        done();
      });
    });

    it('should filter tasks by category', (done) => {
      store.setFilters({ category: ['testing'] });

      store.filteredTasks$.subscribe((tasks) => {
        expect(tasks).toHaveLength(1);
        expect(tasks[0].category).toBe('testing');
        done();
      });
    });

    it('should filter tasks by search query (title)', (done) => {
      store.setFilters({ searchQuery: 'Another' });

      store.filteredTasks$.subscribe((tasks) => {
        expect(tasks).toHaveLength(1);
        expect(tasks[0].title).toContain('Another');
        done();
      });
    });

    it('should filter tasks by search query (description)', (done) => {
      store.setFilters({ searchQuery: 'Description' });

      store.filteredTasks$.subscribe((tasks) => {
        expect(tasks.length).toBeGreaterThan(0);
        expect(tasks[0].description).toContain('Description');
        done();
      });
    });

    it('should handle case-insensitive search', (done) => {
      store.setFilters({ searchQuery: 'test task' });

      store.filteredTasks$.subscribe((tasks) => {
        expect(tasks.length).toBeGreaterThan(0);
        done();
      });
    });
  });

  describe('Sorting', () => {
    beforeEach(() => {
      const tasks = [
        { ...mockTask, title: 'C Task', createdAt: '2024-01-03T00:00:00Z', priority: 'low' },
        { ...mockTask, id: 'task-2', title: 'A Task', createdAt: '2024-01-01T00:00:00Z', priority: 'high' },
        { ...mockTask, id: 'task-3', title: 'B Task', createdAt: '2024-01-02T00:00:00Z', priority: 'medium' },
      ];
      store.setTasks(tasks);
    });

    it('should sort tasks by title ascending', (done) => {
      store.setSortBy('title');
      store.setSortOrder('asc');

      store.filteredTasks$.subscribe((tasks) => {
        expect(tasks[0].title).toBe('A Task');
        expect(tasks[1].title).toBe('B Task');
        expect(tasks[2].title).toBe('C Task');
        done();
      });
    });

    it('should sort tasks by title descending', (done) => {
      store.setSortBy('title');
      store.setSortOrder('desc');

      store.filteredTasks$.subscribe((tasks) => {
        expect(tasks[0].title).toBe('C Task');
        expect(tasks[2].title).toBe('A Task');
        done();
      });
    });

    it('should sort tasks by createdAt ascending', (done) => {
      store.setSortBy('createdAt');
      store.setSortOrder('asc');

      store.filteredTasks$.subscribe((tasks) => {
        expect(tasks[0].id).toBe('task-2'); // Oldest first
        done();
      });
    });

    it('should sort tasks by createdAt descending', (done) => {
      store.setSortBy('createdAt');
      store.setSortOrder('desc');

      store.filteredTasks$.subscribe((tasks) => {
        expect(tasks[0].id).toBe('task-1'); // Newest first
        done();
      });
    });

    it('should sort tasks by priority ascending', (done) => {
      store.setSortBy('priority');
      store.setSortOrder('asc');

      store.filteredTasks$.subscribe((tasks) => {
        expect(tasks[0].priority).toBe('low');
        expect(tasks[2].priority).toBe('high');
        done();
      });
    });

    it('should sort tasks by priority descending', (done) => {
      store.setSortBy('priority');
      store.setSortOrder('desc');

      store.filteredTasks$.subscribe((tasks) => {
        expect(tasks[0].priority).toBe('high');
        expect(tasks[2].priority).toBe('low');
        done();
      });
    });
  });

  describe('Load Tasks Effect', () => {
    it('should load tasks successfully', (done) => {
      taskService.getTasks.mockReturnValue(of([mockTask, mockTask2]));

      store.loadTasks();

      setTimeout(() => {
        store.tasks$.subscribe((tasks) => {
          expect(tasks).toHaveLength(2);
          expect(taskService.getTasks).toHaveBeenCalled();
          done();
        });
      }, 100);
    });

    it('should set loading state during load', (done) => {
      taskService.getTasks.mockReturnValue(of([mockTask]));

      let loadingStates: boolean[] = [];
      store.loading$.subscribe((loading) => {
        loadingStates.push(loading);
      });

      store.loadTasks();

      setTimeout(() => {
        expect(loadingStates).toContain(true);
        done();
      }, 100);
    });

    it('should handle error during load', (done) => {
      taskService.getTasks.mockReturnValue(throwError(() => new Error('Load failed')));

      store.loadTasks();

      setTimeout(() => {
        store.error$.subscribe((error) => {
          expect(error).toBe('Load failed');
          done();
        });
      }, 100);
    });
  });

  describe('Create Task Effect', () => {
    it('should create task successfully', (done) => {
      const createDto: CreateTaskDto = {
        title: 'New Task',
        description: 'New Description',
        status: 'todo',
        priority: 'high',
        category: 'development',
      };

      taskService.createTask.mockReturnValue(of(mockTask));

      store.createTask(createDto);

      setTimeout(() => {
        store.tasks$.subscribe((tasks) => {
          expect(tasks).toContain(mockTask);
          expect(taskService.createTask).toHaveBeenCalledWith(createDto);
          done();
        });
      }, 100);
    });

    it('should handle error during create', (done) => {
      const createDto: CreateTaskDto = {
        title: 'New Task',
        description: 'New Description',
        status: 'todo',
        priority: 'high',
        category: 'development',
      };

      taskService.createTask.mockReturnValue(throwError(() => new Error('Create failed')));

      store.createTask(createDto);

      setTimeout(() => {
        store.error$.subscribe((error) => {
          expect(error).toBe('Create failed');
          done();
        });
      }, 100);
    });
  });

  describe('Update Task Effect', () => {
    beforeEach(() => {
      store.setTasks([mockTask]);
    });

    it('should update task successfully', (done) => {
      const updateDto: UpdateTaskDto = {
        title: 'Updated Title',
        status: 'in-progress',
      };

      const updatedTask = { ...mockTask, ...updateDto };
      taskService.updateTask.mockReturnValue(of(updatedTask));

      store.updateTaskEffect({ id: 'task-1', dto: updateDto });

      setTimeout(() => {
        store.tasks$.subscribe((tasks) => {
          expect(tasks[0].title).toBe('Updated Title');
          expect(taskService.updateTask).toHaveBeenCalledWith('task-1', updateDto);
          done();
        });
      }, 100);
    });

    it('should rollback on error', (done) => {
      const updateDto: UpdateTaskDto = {
        title: 'Updated Title',
      };

      taskService.updateTask.mockReturnValue(throwError(() => new Error('Update failed')));

      store.updateTaskEffect({ id: 'task-1', dto: updateDto, rollbackTask: mockTask });

      setTimeout(() => {
        store.tasks$.subscribe((tasks) => {
          expect(tasks[0].title).toBe(mockTask.title); // Should rollback
          done();
        });
      }, 100);
    });
  });

  describe('Delete Task Effect', () => {
    beforeEach(() => {
      store.setTasks([mockTask, mockTask2]);
    });

    it('should delete task successfully', (done) => {
      taskService.deleteTask.mockReturnValue(of(undefined));

      store.deleteTaskEffect({ id: 'task-1' });

      setTimeout(() => {
        store.tasks$.subscribe((tasks) => {
          expect(tasks).toHaveLength(1);
          expect(tasks.find(t => t.id === 'task-1')).toBeUndefined();
          expect(taskService.deleteTask).toHaveBeenCalledWith('task-1');
          done();
        });
      }, 100);
    });

    it('should rollback on error', (done) => {
      taskService.deleteTask.mockReturnValue(throwError(() => new Error('Delete failed')));

      store.deleteTaskEffect({ id: 'task-1', rollbackTask: mockTask });

      setTimeout(() => {
        store.tasks$.subscribe((tasks) => {
          expect(tasks.find(t => t.id === 'task-1')).toBeDefined(); // Should rollback
          done();
        });
      }, 100);
    });
  });

  describe('Optimistic Updates', () => {
    beforeEach(() => {
      store.setTasks([mockTask]);
    });

    it('should update task optimistically', (done) => {
      store.updateTaskOptimistic({ id: 'task-1', changes: { status: 'in-progress' } });

      store.tasks$.subscribe((tasks) => {
        expect(tasks[0].status).toBe('in-progress');
        done();
      });
    });

    it('should remove task optimistically', (done) => {
      store.removeTaskOptimistic('task-1');

      store.tasks$.subscribe((tasks) => {
        expect(tasks).toHaveLength(0);
        done();
      });
    });
  });
});
