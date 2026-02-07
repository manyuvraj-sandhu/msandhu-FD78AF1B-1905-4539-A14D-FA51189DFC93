/**
 * Shared domain interfaces: User, Organization, Role, Task.
 */

export type Role = 'owner' | 'admin' | 'viewer';

export interface User {
  id: string;
  email: string;
  organizationId: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  category?: string;
  createdById: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}
