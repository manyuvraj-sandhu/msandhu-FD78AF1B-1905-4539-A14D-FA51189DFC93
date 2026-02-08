import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, ActivatedRouteSnapshot } from '@angular/router';
import { roleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';
import { Role } from '@org/data';

describe('roleGuard', () => {
  let authService: jest.Mocked<AuthService>;
  let router: jest.Mocked<Router>;

  const mockUser = {
    sub: 'user-1',
    email: 'test@example.com',
    organizationId: 'org-1',
    role: 'admin' as Role,
  };

  beforeEach(() => {
    const authServiceMock = {
      getCurrentUser: jest.fn(),
      hasRole: jest.fn(),
    };

    const routerMock = {
      createUrlTree: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    authService = TestBed.inject(AuthService) as jest.Mocked<AuthService>;
    router = TestBed.inject(Router) as jest.Mocked<Router>;
  });

  const createMockRoute = (roles?: Role[]): ActivatedRouteSnapshot => {
    return {
      data: roles ? { roles } : {},
    } as ActivatedRouteSnapshot;
  };

  it('should allow access when no roles are required', () => {
    const route = createMockRoute();

    const result = TestBed.runInInjectionContext(() => roleGuard(route, null as any));

    expect(result).toBe(true);
  });

  it('should redirect to login when user is not authenticated', () => {
    authService.getCurrentUser.mockReturnValue(null);
    const urlTree = { toString: () => '/login' } as UrlTree;
    router.createUrlTree.mockReturnValue(urlTree);
    const route = createMockRoute(['admin'] as Role[]);

    const result = TestBed.runInInjectionContext(() => roleGuard(route, null as any));

    expect(result).toBe(urlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
  });

  it('should allow access when user has required role', () => {
    authService.getCurrentUser.mockReturnValue(mockUser);
    authService.hasRole.mockReturnValue(true);
    const route = createMockRoute(['admin'] as Role[]);

    const result = TestBed.runInInjectionContext(() => roleGuard(route, null as any));

    expect(result).toBe(true);
    expect(authService.hasRole).toHaveBeenCalledWith('admin');
  });

  it('should allow access when user has one of multiple required roles', () => {
    authService.getCurrentUser.mockReturnValue(mockUser);
    authService.hasRole.mockImplementation((role: Role) => role === 'admin');
    const route = createMockRoute(['admin', 'owner'] as Role[]);

    const result = TestBed.runInInjectionContext(() => roleGuard(route, null as any));

    expect(result).toBe(true);
  });

  it('should redirect to dashboard when user lacks required role', () => {
    authService.getCurrentUser.mockReturnValue(mockUser);
    authService.hasRole.mockReturnValue(false);
    const urlTree = { toString: () => '/dashboard' } as UrlTree;
    router.createUrlTree.mockReturnValue(urlTree);
    const route = createMockRoute(['owner'] as Role[]);

    const result = TestBed.runInInjectionContext(() => roleGuard(route, null as any));

    expect(result).toBe(urlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should allow ADMIN to access ADMIN routes', () => {
    const adminUser = { ...mockUser, role: 'admin' as Role };
    authService.getCurrentUser.mockReturnValue(adminUser);
    authService.hasRole.mockReturnValue(true);
    const route = createMockRoute(['admin'] as Role[]);

    const result = TestBed.runInInjectionContext(() => roleGuard(route, null as any));

    expect(result).toBe(true);
  });

  it('should block VIEWER from accessing ADMIN routes', () => {
    const viewerUser = { ...mockUser, role: 'viewer' as Role };
    authService.getCurrentUser.mockReturnValue(viewerUser);
    authService.hasRole.mockReturnValue(false);
    const urlTree = { toString: () => '/dashboard' } as UrlTree;
    router.createUrlTree.mockReturnValue(urlTree);
    const route = createMockRoute(['admin'] as Role[]);

    const result = TestBed.runInInjectionContext(() => roleGuard(route, null as any));

    expect(result).toBe(urlTree);
  });

  it('should allow OWNER to access all routes', () => {
    const ownerUser = { ...mockUser, role: 'owner' as Role };
    authService.getCurrentUser.mockReturnValue(ownerUser);
    authService.hasRole.mockReturnValue(true);
    const route = createMockRoute(['admin'] as Role[]);

    const result = TestBed.runInInjectionContext(() => roleGuard(route, null as any));

    expect(result).toBe(true);
  });
});
