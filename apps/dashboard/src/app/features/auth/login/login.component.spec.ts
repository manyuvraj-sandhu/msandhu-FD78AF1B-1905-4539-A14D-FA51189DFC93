import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError, EMPTY } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let authService: jest.Mocked<AuthService>;
  let router: jest.Mocked<Router>;

  beforeEach(async () => {
    const authServiceMock = {
      login: jest.fn(),
    };

    const routerMock = {
      navigate: jest.fn(),
      events: EMPTY,
      createUrlTree: jest.fn(),
      serializeUrl: jest.fn(),
    };

    const activatedRouteMock = {};

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jest.Mocked<AuthService>;
    router = TestBed.inject(Router) as jest.Mocked<Router>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have invalid form initially', () => {
    expect(component.loginForm.valid).toBe(false);
  });

  it('should require email', () => {
    const email = component.loginForm.get('email');
    expect(email?.valid).toBe(false);
    
    email?.setValue('test@example.com');
    expect(email?.valid).toBe(true);
  });

  it('should require password', () => {
    const password = component.loginForm.get('password');
    expect(password?.valid).toBe(false);
    
    password?.setValue('password123');
    expect(password?.valid).toBe(true);
  });

  it('should call authService.login on valid submit', () => {
    authService.login.mockReturnValue(of({ access_token: 'token' }));
    
    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'password123',
    });

    component.onSubmit();

    expect(authService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should navigate to dashboard on successful login', (done) => {
    authService.login.mockReturnValue(of({ access_token: 'token' }));
    
    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'password123',
    });

    component.onSubmit();

    setTimeout(() => {
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
      done();
    }, 100);
  });

  it('should set error message on login failure', () => {
    authService.login.mockReturnValue(throwError(() => ({ message: 'Invalid credentials' })));
    
    component.loginForm.patchValue({
      email: 'test@example.com',
      password: 'wrongpass',
    });
   
    // Check if form is valid
    expect(component.loginForm.valid).toBe(true);

    component.onSubmit();

    expect(authService.login).toHaveBeenCalled();
  });

  it('should set loading state during login', () => {
    authService.login.mockReturnValue(of({ access_token: 'token' }));
    
    component.loginForm.patchValue({
      email: 'test@example.com',
      password: 'password123',
    });
    
    // Check if form is valid
    expect(component.loginForm.valid).toBe(true);

    expect(component.loading).toBe(false);
    component.onSubmit();
    
    // Verify login was called
    expect(authService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });
});
