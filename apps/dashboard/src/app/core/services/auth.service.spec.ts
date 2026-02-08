import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { LoginDto, Role } from '@org/data';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: jest.Mocked<Router>;
  let localStorageSpy: jest.SpyInstance;

  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJvcmdhbml6YXRpb25JZCI6Im9yZy0xIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.MOCK_SIGNATURE';

  beforeEach(() => {
    const routerMock = {
      navigate: jest.fn(),
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerMock },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router) as jest.Mocked<Router>;

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should login successfully and store token', (done) => {
      const credentials: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      service.login(credentials).subscribe((response) => {
        expect(response.access_token).toBe(mockToken);
        expect(localStorage.getItem('access_token')).toBe(mockToken);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);
      req.flush({ access_token: mockToken });
    });

    it('should update currentUser$ observable on login', (done) => {
      const credentials: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      service.login(credentials).subscribe(() => {
        service.currentUser$.subscribe((user) => {
          expect(user).toBeTruthy();
          expect(user?.email).toBe('test@example.com');
          done();
        });
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush({ access_token: mockToken });
    });
  });

  describe('register', () => {
    it('should register successfully and store token', (done) => {
      const registerData = {
        email: 'newuser@example.com',
        password: 'password123',
        organizationName: 'Test Org',
        role: 'member',
      };

      service.register(registerData).subscribe((response) => {
        expect(response.access_token).toBe(mockToken);
        expect(localStorage.getItem('access_token')).toBe(mockToken);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(registerData);
      req.flush({ access_token: mockToken });
    });

    it('should update currentUser$ observable on register', (done) => {
      const registerData = {
        email: 'newuser@example.com',
        password: 'password123',
        organizationName: 'Test Org',
        role: 'member',
      };

      service.register(registerData).subscribe(() => {
        service.currentUser$.subscribe((user) => {
          expect(user).toBeTruthy();
          done();
        });
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
      req.flush({ access_token: mockToken });
    });
  });

  describe('logout', () => {
    it('should remove token and navigate to login', () => {
      localStorage.setItem('access_token', mockToken);
      
      service.logout();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should set currentUser$ to null', (done) => {
      localStorage.setItem('access_token', mockToken);
      
      service.logout();

      service.currentUser$.subscribe((user) => {
        expect(user).toBeNull();
        done();
      });
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when valid token exists', () => {
      localStorage.setItem('access_token', mockToken);

      const result = service.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false when no token exists', () => {
      const result = service.isAuthenticated();

      expect(result).toBe(false);
    });

    it('should return false and logout when token is expired', () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJvcmdhbml6YXRpb25JZCI6Im9yZy0xIiwicm9sZSI6Im1lbWJlciIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxfQ.MOCK_SIGNATURE';
      localStorage.setItem('access_token', expiredToken);

      const result = service.isAuthenticated();

      expect(result).toBe(false);
      expect(localStorage.getItem('access_token')).toBeNull();
    });

    it('should return false with invalid token', () => {
      localStorage.setItem('access_token', 'invalid-token');

      const result = service.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user from token', (done) => {
      const mockResponse = { access_token: mockToken };
      
      service.login({ email: 'test@example.com', password: 'password' }).subscribe(() => {
        const user = service.getCurrentUser();
        expect(user).toBeTruthy();
        expect(user?.email).toBe('test@example.com');
        done();
      });
      
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockResponse);
    });

    it('should return null when no token exists', () => {
      const user = service.getCurrentUser();

      expect(user).toBeNull();
    });
  });

  describe('hasRole', () => {
    it('should return true when user has exact role', (done) => {
      const mockResponse = { access_token: mockToken };
      
      service.login({ email: 'test@example.com', password: 'password' }).subscribe(() => {
        const result = service.hasRole('admin' as Role);
        expect(result).toBe(true);
        done();
      });
      
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockResponse);
    });

    it('should return true when user has higher role', (done) => {
      const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJvcmdhbml6YXRpb25JZCI6Im9yZy0xIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.MOCK_SIGNATURE';
      const mockResponse = { access_token: adminToken };
      
      service.login({ email: 'test@example.com', password: 'password' }).subscribe(() => {
        const result = service.hasRole('viewer' as Role);
        expect(result).toBe(true);
        done();
      });
      
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockResponse);
    });

    it('should return false when user has lower role', (done) => {
      const viewerToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJvcmdhbml6YXRpb25JZCI6Im9yZy0xIiwicm9sZSI6InZpZXdlciIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjo5OTk5OTk5OTk5fQ.MOCK_SIGNATURE';
      const mockResponse = { access_token: viewerToken };
      
      service.login({ email: 'test@example.com', password: 'password' }).subscribe(() => {
        const result = service.hasRole('admin' as Role);
        expect(result).toBe(false);
        done();
      });
      
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockResponse);
    });

    it('should return false when user is not authenticated', () => {
      const result = service.hasRole('admin' as Role);

      expect(result).toBe(false);
    });
  });

  describe('decodeToken', () => {
    it('should decode a valid JWT token', () => {
      const decoded = service.decodeToken(mockToken);

      expect(decoded.sub).toBe('user-1');
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.organizationId).toBe('org-1');
      expect(decoded.role).toBe('admin');
    });
  });
});
