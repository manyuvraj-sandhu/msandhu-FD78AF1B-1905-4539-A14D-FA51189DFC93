import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { errorInterceptor } from './error.interceptor';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

describe('errorInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let router: jest.Mocked<Router>;

  beforeEach(() => {
    const routerMock = {
      navigate: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerMock },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router) as jest.Mocked<Router>;
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should handle 401 error and navigate to login', (done) => {
    localStorage.setItem('access_token', 'token');

    httpClient.get('/api/tasks').subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error.message).toBe('Session expired. Please login again.');
        expect(localStorage.getItem('access_token')).toBeNull();
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
        done();
      },
    });

    const req = httpMock.expectOne('/api/tasks');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
  });

  it('should handle server error with custom message', (done) => {
    httpClient.get('/api/tasks').subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error.message).toBe('Server error occurred');
        done();
      },
    });

    const req = httpMock.expectOne('/api/tasks');
    req.flush({ message: 'Server error occurred' }, { status: 500, statusText: 'Internal Server Error' });
  });

  it('should handle error without custom message', (done) => {
    httpClient.get('/api/tasks').subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error.message).toContain('Error Code: 404');
        done();
      },
    });

    const req = httpMock.expectOne('/api/tasks');
    req.flush('Not found', { status: 404, statusText: 'Not Found' });
  });

  it('should handle client-side error', (done) => {
    httpClient.get('/api/tasks').subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error.message).toBeDefined();
        done();
      },
    });

    const req = httpMock.expectOne('/api/tasks');
    req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
  });
});
