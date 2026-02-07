import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Task, CreateTaskDto, UpdateTaskDto } from '@org/data';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-form.component.html'
})
export class TaskFormComponent implements OnInit {
  @Input() task: Task | null = null;
  @Output() save = new EventEmitter<CreateTaskDto | UpdateTaskDto>();
  @Output() cancel = new EventEmitter<void>();

  taskForm!: FormGroup;
  isEditMode = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.isEditMode = !!this.task;
    
    this.taskForm = this.fb.group({
      title: [this.task?.title || '', [Validators.required, Validators.minLength(1)]],
      description: [this.task?.description || ''],
      status: [this.task?.status || 'todo', Validators.required],
      category: [this.task?.category || '']
    });
  }

  onSubmit(): void {
    if (this.taskForm.invalid) {
      return;
    }

    this.save.emit(this.taskForm.value);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
