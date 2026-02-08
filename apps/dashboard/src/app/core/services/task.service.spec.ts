import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TaskService } from './task.service';
import { Task, CreateTaskDto, UpdateTaskDto } from '@org/data';
import { environment } from '../../../environments/environment';

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;

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

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TaskService],
    });

    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getTasks', () => {
    it('should fetch all tasks', (done) => {
      const mockTasks: Task[] = [mockTask];

      service.getTasks().subscribe((tasks) => {
        expect(tasks).toEqual(mockTasks);
        expect(tasks.length).toBe(1);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tasks`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTasks);
    });

    it('should return empty array when no tasks exist', (done) => {
      service.getTasks().subscribe((tasks) => {
        expect(tasks).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tasks`);
      req.flush([]);
    });

    it('should handle error response', (done) => {
      service.getTasks().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tasks`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getTask', () => {
    it('should fetch a single task by id', (done) => {
      service.getTask('task-1').subscribe((task) => {
        expect(task).toEqual(mockTask);
        expect(task.id).toBe('task-1');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tasks/task-1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTask);
    });

    it('should handle 404 error when task not found', (done) => {
      service.getTask('non-existent').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tasks/non-existent`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('createTask', () => {
    it('should create a new task', (done) => {
      const createDto: CreateTaskDto = {
        title: 'New Task',
        description: 'New Description',
        status: 'todo',
        priority: 'high',
        category: 'development',
      };

      const expectedTask = { ...mockTask, ...createDto };

      service.createTask(createDto).subscribe((task) => {
        expect(task).toEqual(expectedTask);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tasks`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createDto);
      req.flush(expectedTask);
    });

    it('should handle validation errors', (done) => {
      const invalidDto: CreateTaskDto = {
        title: '',
        description: '',
        status: 'todo',
        priority: 'high',
        category: 'development',
      };

      service.createTask(invalidDto).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tasks`);
      req.flush({ message: 'Validation failed' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('updateTask', () => {
    it('should update an existing task', (done) => {
      const updateDto: UpdateTaskDto = {
        title: 'Updated Task',
        status: 'in-progress',
      };

      const updatedTask = { ...mockTask, ...updateDto };

      service.updateTask('task-1', updateDto).subscribe((task) => {
        expect(task).toEqual(updatedTask);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tasks/task-1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateDto);
      req.flush(updatedTask);
    });

    it('should handle 404 error when updating non-existent task', (done) => {
      const updateDto: UpdateTaskDto = {
        status: 'done',
      };

      service.updateTask('non-existent', updateDto).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tasks/non-existent`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle 403 error when user lacks permission', (done) => {
      const updateDto: UpdateTaskDto = {
        status: 'done',
      };

      service.updateTask('task-1', updateDto).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(403);
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tasks/task-1`);
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('deleteTask', () => {
    it('should delete a task', (done) => {
      service.deleteTask('task-1').subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tasks/task-1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should handle 404 error when deleting non-existent task', (done) => {
      service.deleteTask('non-existent').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tasks/non-existent`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle 403 error when user lacks permission', (done) => {
      service.deleteTask('task-1').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(403);
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tasks/task-1`);
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });
  });
});
