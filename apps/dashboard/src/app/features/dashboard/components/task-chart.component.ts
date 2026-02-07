import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '@org/data';

interface TaskStat {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

@Component({
  selector: 'app-task-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Task Overview</h3>
      
      <div class="space-y-3">
        <div *ngFor="let stat of stats" class="space-y-1">
          <div class="flex justify-between text-sm">
            <span class="font-medium text-gray-700 dark:text-gray-300">{{ stat.label }}</span>
            <span class="text-gray-600 dark:text-gray-400">{{ stat.count }} tasks ({{ stat.percentage | number:'1.0-0' }}%)</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              [class]="'h-full rounded-full transition-all duration-500 ' + stat.color"
              [style.width.%]="stat.percentage"
            ></div>
          </div>
        </div>
      </div>

      <div *ngIf="tasks.length === 0" class="text-center text-gray-500 dark:text-gray-400 py-4">
        No tasks yet. Create your first task to get started!
      </div>
    </div>
  `
})
export class TaskChartComponent {
  @Input() tasks: Task[] = [];

  get stats(): TaskStat[] {
    const total = this.tasks.length || 1; // Avoid division by zero
    const todo = this.tasks.filter(t => t.status === 'todo').length;
    const inProgress = this.tasks.filter(t => t.status === 'in_progress').length;
    const done = this.tasks.filter(t => t.status === 'done').length;

    return [
      {
        label: 'To Do',
        count: todo,
        percentage: (todo / total) * 100,
        color: 'bg-gray-500'
      },
      {
        label: 'In Progress',
        count: inProgress,
        percentage: (inProgress / total) * 100,
        color: 'bg-yellow-500'
      },
      {
        label: 'Done',
        count: done,
        percentage: (done / total) * 100,
        color: 'bg-green-500'
      }
    ];
  }
}
