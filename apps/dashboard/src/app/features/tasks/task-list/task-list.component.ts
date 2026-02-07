import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Task, CreateTaskDto, UpdateTaskDto } from '@org/data';
import { TaskStore } from '../store/task.store';
import { TaskCardComponent } from '../task-card/task-card.component';
import { TaskFormComponent } from '../task-form/task-form.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner.component';
import { AuthService } from '../../../core/services/auth.service';
import { KeyboardService } from '../../../core/services/keyboard.service';
import { TaskChartComponent } from '../../dashboard/components/task-chart.component';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    TaskCardComponent,
    TaskFormComponent,
    ConfirmDialogComponent,
    LoadingSpinnerComponent,
    TaskChartComponent
  ],
  providers: [TaskStore],
  templateUrl: './task-list.component.html'
})
export class TaskListComponent implements OnInit, OnDestroy {
  tasks$;
  loading$;
  filters$;

  showTaskForm = false;
  showConfirmDialog = false;
  editingTask: Task | null = null;
  deletingTask: Task | null = null;

  searchQuery = '';
  selectedCategories: string[] = [];
  selectedStatuses: string[] = [];

  constructor(
    private taskStore: TaskStore,
    private authService: AuthService,
    private keyboardService: KeyboardService
  ) {
    this.tasks$ = this.taskStore.filteredTasks$;
    this.loading$ = this.taskStore.loading$;
    this.filters$ = this.taskStore.filters$;
  }

  ngOnInit(): void {
    this.taskStore.loadTasks();

    // Register keyboard shortcuts
    this.keyboardService.registerShortcut('n', () => {
      if (this.canEdit) {
        this.openCreateDialog();
      }
    });
    this.keyboardService.registerShortcut('f', () => {
      const searchInput = document.getElementById('search-input') as HTMLInputElement;
      searchInput?.focus();
    });
  }

  ngOnDestroy(): void {
    this.keyboardService.unregisterShortcut('n');
    this.keyboardService.unregisterShortcut('f');
  }

  get canEdit(): boolean {
    return this.authService.hasRole('admin');
  }

  get todoTasks(): Task[] {
    return this.getTasksByStatus('todo');
  }

  get inProgressTasks(): Task[] {
    return this.getTasksByStatus('in_progress');
  }

  get doneTasks(): Task[] {
    return this.getTasksByStatus('done');
  }

  getTasksByStatus(status: string): Task[] {
    let tasks: Task[] = [];
    this.tasks$.subscribe(t => tasks = t).unsubscribe();
    return tasks.filter(t => t.status === status);
  }

  getAllTasks(): Task[] {
    let tasks: Task[] = [];
    this.tasks$.subscribe(t => tasks = t).unsubscribe();
    return tasks;
  }

  onDrop(event: CdkDragDrop<Task[]>, newStatus: 'todo' | 'in_progress' | 'done'): void {
    const task = event.previousContainer.data[event.previousIndex];

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Update task status if moved to different column
      if (task.status !== newStatus) {
        this.taskStore.updateTaskEffect({ id: task.id, dto: { status: newStatus } });
      }
    }
  }

  openCreateDialog(): void {
    this.editingTask = null;
    this.showTaskForm = true;
  }

  openEditDialog(task: Task): void {
    this.editingTask = task;
    this.showTaskForm = true;
  }

  openDeleteDialog(task: Task): void {
    this.deletingTask = task;
    this.showConfirmDialog = true;
  }

  onSaveTask(dto: CreateTaskDto | UpdateTaskDto): void {
    if (this.editingTask) {
      this.taskStore.updateTaskEffect({ id: this.editingTask.id, dto: dto as UpdateTaskDto });
    } else {
      this.taskStore.createTask(dto as CreateTaskDto);
    }
    this.showTaskForm = false;
    this.editingTask = null;
  }

  onConfirmDelete(): void {
    if (this.deletingTask) {
      this.taskStore.deleteTaskEffect(this.deletingTask.id);
    }
    this.showConfirmDialog = false;
    this.deletingTask = null;
  }

  onCancelDelete(): void {
    this.showConfirmDialog = false;
    this.deletingTask = null;
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.taskStore.setFilters({ searchQuery: query });
  }

  onCategoryChange(categories: string[]): void {
    this.taskStore.setFilters({ category: categories });
  }

  onStatusChange(statuses: string[]): void {
    this.taskStore.setFilters({ status: statuses });
  }

  onSortChange(sortBy: 'createdAt' | 'title' | 'status'): void {
    this.taskStore.setSortBy(sortBy);
  }

  toggleCategory(category: string): void {
    if (this.selectedCategories.includes(category)) {
      this.selectedCategories = this.selectedCategories.filter(c => c !== category);
    } else {
      this.selectedCategories.push(category);
    }
    this.onCategoryChange(this.selectedCategories);
  }

  getUniqueCategories(): string[] {
    const tasks = this.getAllTasks();
    const categories = tasks
      .map(t => t.category)
      .filter(c => c) as string[];
    return [...new Set(categories)];
  }
}
