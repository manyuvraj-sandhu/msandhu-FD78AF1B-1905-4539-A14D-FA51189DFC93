import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should add Authorization header when token exists', (done) => {
    localStorage.setItem('access_token', 'test-token');

    httpClient.get('/api/tasks').subscribe(() => {
      done();
    });

    const req = httpMock.expectOne('/api/tasks');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    req.flush({});
  });

  it('should not add Authorization header when no token', (done) => {
    httpClient.get('/api/tasks').subscribe(() => {
      done();
    });

    const req = httpMock.expectOne('/api/tasks');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should not add Authorization header for login endpoint', (done) => {
    localStorage.setItem('access_token', 'test-token');

    httpClient.post('/auth/login', {}).subscribe(() => {
      done();
    });

    const req = httpMock.expectOne('/auth/login');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should not add Authorization header for register endpoint', (done) => {
    localStorage.setItem('access_token', 'test-token');

    httpClient.post('/auth/register', {}).subscribe(() => {
      done();
    });

    const req = httpMock.expectOne('/auth/register');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});
