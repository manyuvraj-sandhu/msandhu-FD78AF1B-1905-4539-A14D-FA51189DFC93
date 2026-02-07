import type { Role } from '@org/data';
import { hasRoleOrAbove } from './roles';

export type Permission = 'task:create' | 'task:read' | 'task:update' | 'task:delete' | 'audit:read';

const PERMISSION_BY_ROLE: Record<Role, Permission[]> = {
  owner: ['task:create', 'task:read', 'task:update', 'task:delete', 'audit:read'],
  admin: ['task:create', 'task:read', 'task:update', 'task:delete'],
  viewer: ['task:read'],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  const allowed = PERMISSION_BY_ROLE[role];
  return allowed?.includes(permission) ?? false;
}

export function canCreateTask(role: Role): boolean {
  return hasRoleOrAbove(role, 'admin');
}

export function canUpdateOrDeleteTask(role: Role): boolean {
  return hasRoleOrAbove(role, 'admin');
}
