import type { Role } from '@org/data';

/**
 * Role hierarchy: Owner > Admin > Viewer.
 * Higher roles inherit permissions of lower roles.
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 3,
  admin: 2,
  viewer: 1,
};

export function hasRoleOrAbove(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function isOwner(role: Role): boolean {
  return role === 'owner';
}

export function isAdminOrAbove(role: Role): boolean {
  return hasRoleOrAbove(role, 'admin');
}

export function canViewAuditLog(role: Role): boolean {
  return isOwner(role);
}
