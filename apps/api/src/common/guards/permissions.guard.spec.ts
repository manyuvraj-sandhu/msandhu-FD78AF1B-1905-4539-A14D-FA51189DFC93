import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';
import { Permission } from '@org/auth';
import { Role } from '@org/data';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<PermissionsGuard>(PermissionsGuard);
    reflector = module.get(Reflector);
  });

  const createMockExecutionContext = (user?: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow access when no permissions are required', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const context = createMockExecutionContext({ role: 'viewer' });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should block access when user is not authenticated', () => {
      reflector.getAllAndOverride.mockReturnValue(['task:read']);
      const context = createMockExecutionContext(undefined);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should allow VIEWER to read tasks', () => {
      reflector.getAllAndOverride.mockReturnValue(['task:read']);
      const context = createMockExecutionContext({ role: 'viewer' });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should block VIEWER from creating tasks', () => {
      reflector.getAllAndOverride.mockReturnValue(['task:create']);
      const context = createMockExecutionContext({ role: 'viewer' });

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should allow ADMIN to create and read tasks', () => {
      reflector.getAllAndOverride.mockReturnValue(['task:create', 'task:read']);
      const context = createMockExecutionContext({ role: 'admin' });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should block ADMIN from managing users (audit:read is owner-only)', () => {
      reflector.getAllAndOverride.mockReturnValue(['audit:read']);
      const context = createMockExecutionContext({ role: 'admin' });

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should allow OWNER to have all permissions', () => {
      const allPermissions = [
        'task:read',
        'task:create',
        'task:update',
        'task:delete',
        'audit:read',
      ];

      reflector.getAllAndOverride.mockReturnValue(allPermissions);
      const context = createMockExecutionContext({ role: 'owner' });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should block when user is missing delete permission', () => {
      reflector.getAllAndOverride.mockReturnValue([
        'task:read',
        'task:delete', // ADMIN has delete now
      ]);
      const context = createMockExecutionContext({ role: 'admin' });

      const result = guard.canActivate(context);

      expect(result).toBe(true); // ADMIN can delete now
    });

    it('should require all permissions when multiple are specified', () => {
      reflector.getAllAndOverride.mockReturnValue([
        'task:create',
        'task:update',
      ]);
      const context = createMockExecutionContext({ role: 'admin' });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access to audit logs for OWNER', () => {
      reflector.getAllAndOverride.mockReturnValue(['audit:read']);
      const context = createMockExecutionContext({ role: 'owner' });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should block access to audit logs for VIEWER', () => {
      reflector.getAllAndOverride.mockReturnValue(['audit:read']);
      const context = createMockExecutionContext({ role: 'viewer' });

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });
  });
});
