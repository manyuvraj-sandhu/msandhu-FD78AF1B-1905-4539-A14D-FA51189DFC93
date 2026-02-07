import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '@org/data';
import { TruncatePipe } from '../../../shared/pipes/truncate.pipe';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, TruncatePipe],
  template: `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-move">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {{ task.title }}
      </h3>
      
      <p *ngIf="task.description" class="text-sm text-gray-600 dark:text-gray-400 mb-3">
        {{ task.description | truncate:100 }}
      </p>

      <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
        <span *ngIf="task.category" class="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
          {{ task.category }}
        </span>
        <span>{{ task.createdAt | date:'short' }}</span>
      </div>

      <div *ngIf="canEdit" class="flex space-x-2 border-t dark:border-gray-700 pt-3">
        <button
          (click)="onEdit($event)"
          class="flex-1 px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
        >
          Edit
        </button>
        <button
          (click)="onDelete($event)"
          class="flex-1 px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
        >
          Delete
        </button>
      </div>
    </div>
  `
})
export class TaskCardComponent {
  @Input() task!: Task;
  @Input() canEdit = false;
  @Output() edit = new EventEmitter<Task>();
  @Output() delete = new EventEmitter<Task>();

  onEdit(event: Event): void {
    event.stopPropagation();
    this.edit.emit(this.task);
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.delete.emit(this.task);
  }
}
