import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { Role } from '@org/data';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
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
    it('should allow access when no roles are required', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const context = createMockExecutionContext({ role: 'viewer' });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should block access when user is not authenticated', () => {
      reflector.getAllAndOverride.mockReturnValue(['admin']);
      const context = createMockExecutionContext(undefined);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should allow access when user has exact required role', () => {
      reflector.getAllAndOverride.mockReturnValue(['admin']);
      const context = createMockExecutionContext({ role: 'admin' });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user has higher role than required (OWNER > ADMIN)', () => {
      reflector.getAllAndOverride.mockReturnValue(['admin']);
      const context = createMockExecutionContext({ role: 'owner' });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user has highest role (OWNER > ADMIN)', () => {
      reflector.getAllAndOverride.mockReturnValue(['admin']);
      const context = createMockExecutionContext({ role: 'owner' });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should block access when user has lower role than required', () => {
      reflector.getAllAndOverride.mockReturnValue(['owner']);
      const context = createMockExecutionContext({ role: 'admin' });

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should block access when viewer tries to access admin-only resource', () => {
      reflector.getAllAndOverride.mockReturnValue(['admin']);
      const context = createMockExecutionContext({ role: 'viewer' });

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should allow access when multiple roles are specified and user has one of them', () => {
      reflector.getAllAndOverride.mockReturnValue(['admin', 'owner']);
      const context = createMockExecutionContext({ role: 'admin' });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when multiple roles are specified and user has higher role', () => {
      reflector.getAllAndOverride.mockReturnValue(['viewer', 'admin']);
      const context = createMockExecutionContext({ role: 'owner' });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should test role hierarchy: VIEWER < ADMIN < OWNER', () => {
      const roles: Role[] = ['viewer', 'admin', 'owner'];

      for (let i = 0; i < roles.length; i++) {
        for (let j = 0; j < roles.length; j++) {
          reflector.getAllAndOverride.mockReturnValue([roles[j]]);
          const context = createMockExecutionContext({ role: roles[i] });
          const result = guard.canActivate(context);

          // User with higher or equal role should have access
          expect(result).toBe(i >= j);
        }
      }
    });
  });
});
