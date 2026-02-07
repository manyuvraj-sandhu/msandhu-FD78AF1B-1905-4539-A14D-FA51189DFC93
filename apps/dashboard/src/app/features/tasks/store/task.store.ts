import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { Task, UpdateTaskDto, CreateTaskDto } from '@org/data';
import { TaskService } from '../../../core/services/task.service';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

export interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  filters: {
    status: string[];
    category: string[];
    searchQuery: string;
  };
  sortBy: 'createdAt' | 'title' | 'status';
  sortOrder: 'asc' | 'desc';
}

const initialState: TaskState = {
  tasks: [],
  loading: false,
  error: null,
  filters: {
    status: [],
    category: [],
    searchQuery: ''
  },
  sortBy: 'createdAt',
  sortOrder: 'desc'
};

@Injectable()
export class TaskStore extends ComponentStore<TaskState> {
  constructor(private taskService: TaskService) {
    super(initialState);
  }

  // Selectors
  readonly tasks$ = this.select(state => state.tasks);
  readonly loading$ = this.select(state => state.loading);
  readonly error$ = this.select(state => state.error);
  readonly filters$ = this.select(state => state.filters);
  readonly sortConfig$ = this.select(state => ({ sortBy: state.sortBy, sortOrder: state.sortOrder }));

  // Filtered and sorted tasks
  readonly filteredTasks$ = this.select(
    this.tasks$,
    this.filters$,
    this.sortConfig$,
    (tasks, filters, sort) => {
      let filtered = [...tasks];

      // Apply search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filtered = filtered.filter(task =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query)
        );
      }

      // Apply status filter
      if (filters.status.length > 0) {
        filtered = filtered.filter(task => filters.status.includes(task.status));
      }

      // Apply category filter
      if (filters.category.length > 0) {
        filtered = filtered.filter(task => task.category && filters.category.includes(task.category));
      }

      // Apply sorting
      filtered.sort((a, b) => {
        let comparison = 0;
        
        switch (sort.sortBy) {
          case 'title':
            comparison = a.title.localeCompare(b.title);
            break;
          case 'status':
            comparison = a.status.localeCompare(b.status);
            break;
          case 'createdAt':
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
        }

        return sort.sortOrder === 'asc' ? comparison : -comparison;
      });

      return filtered;
    }
  );

  // Updaters
  readonly setTasks = this.updater((state, tasks: Task[]) => ({
    ...state,
    tasks,
    loading: false,
    error: null
  }));

  readonly setLoading = this.updater((state, loading: boolean) => ({
    ...state,
    loading
  }));

  readonly setError = this.updater((state, error: string) => ({
    ...state,
    error,
    loading: false
  }));

  readonly addTask = this.updater((state, task: Task) => ({
    ...state,
    tasks: [task, ...state.tasks]
  }));

  readonly updateTaskInState = this.updater((state, updatedTask: Task) => ({
    ...state,
    tasks: state.tasks.map(task => task.id === updatedTask.id ? updatedTask : task)
  }));

  readonly updateTaskOptimistic = this.updater((state, payload: { id: string; changes: Partial<Task> }) => ({
    ...state,
    tasks: state.tasks.map(task => 
      task.id === payload.id ? { ...task, ...payload.changes } : task
    )
  }));

  readonly removeTask = this.updater((state, taskId: string) => ({
    ...state,
    tasks: state.tasks.filter(task => task.id !== taskId)
  }));

  readonly removeTaskOptimistic = this.updater((state, taskId: string) => ({
    ...state,
    tasks: state.tasks.filter(task => task.id !== taskId)
  }));

  readonly setFilters = this.updater((state, filters: Partial<TaskState['filters']>) => ({
    ...state,
    filters: { ...state.filters, ...filters }
  }));

  readonly setSortBy = this.updater((state, sortBy: TaskState['sortBy']) => ({
    ...state,
    sortBy
  }));

  readonly setSortOrder = this.updater((state, sortOrder: TaskState['sortOrder']) => ({
    ...state,
    sortOrder
  }));

  // Effects
  readonly loadTasks = this.effect<void>(trigger$ =>
    trigger$.pipe(
      tap(() => this.setLoading(true)),
      switchMap(() =>
        this.taskService.getTasks().pipe(
          tap((tasks: Task[]) => this.setTasks(tasks)),
          catchError((error: Error) => {
            this.setError(error.message);
            return EMPTY;
          })
        )
      )
    )
  );

  readonly createTask = this.effect<CreateTaskDto>(dto$ =>
    dto$.pipe(
      tap(() => this.setLoading(true)),
      switchMap(dto =>
        this.taskService.createTask(dto).pipe(
          tap((task: Task) => {
            this.addTask(task);
            this.setLoading(false);
          }),
          catchError((error: Error) => {
            this.setError(error.message);
            return EMPTY;
          })
        )
      )
    )
  );

  readonly updateTaskEffect = this.effect<{ id: string; dto: UpdateTaskDto; rollbackTask?: Task }>(update$ =>
    update$.pipe(
      switchMap(({ id, dto, rollbackTask }) =>
        this.taskService.updateTask(id, dto).pipe(
          tap((task: Task) => this.updateTaskInState(task)),
          catchError((error: Error) => {
            // Rollback optimistic update on error
            if (rollbackTask) {
              this.updateTaskInState(rollbackTask);
            }
            this.setError(error.message);
            return EMPTY;
          })
        )
      )
    )
  );

  readonly deleteTaskEffect = this.effect<{ id: string; rollbackTask?: Task }>(payload$ =>
    payload$.pipe(
      switchMap(({ id, rollbackTask }) =>
        this.taskService.deleteTask(id).pipe(
          tap(() => this.removeTask(id)),
          catchError((error: Error) => {
            // Rollback optimistic delete on error
            if (rollbackTask) {
              this.addTask(rollbackTask);
            }
            this.setError(error.message);
            return EMPTY;
          })
        )
      )
    )
  );
}
