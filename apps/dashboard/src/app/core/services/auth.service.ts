import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { LoginDto, JwtPayloadDto } from '@org/data';
import { Role } from '@org/data';
import { hasRoleOrAbove } from '@org/auth';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<JwtPayloadDto | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Load user from token on init
    this.loadUserFromToken();
  }

  private loadUserFromToken(): void {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const decoded = this.decodeToken(token);
        this.currentUserSubject.next(decoded);
      } catch (error) {
        // Invalid token
        localStorage.removeItem('access_token');
      }
    }
  }

  login(credentials: LoginDto): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        localStorage.setItem('access_token', response.access_token);
        const user = this.decodeToken(response.access_token);
        this.currentUserSubject.next(user);
      })
    );
  }

  register(registerData: { email: string; password: string; organizationName: string; role: string }): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>(`${this.apiUrl}/register`, registerData).pipe(
      tap(response => {
        localStorage.setItem('access_token', response.access_token);
        const user = this.decodeToken(response.access_token);
        this.currentUserSubject.next(user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getCurrentUser(): JwtPayloadDto | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return false;
    }

    try {
      const decoded = this.decodeToken(token);
      // Check if token is expired
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        this.logout();
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  hasRole(role: Role): boolean {
    const user = this.getCurrentUser();
    if (!user) {
      return false;
    }
    return hasRoleOrAbove(user.role as Role, role);
  }

  decodeToken(token: string): JwtPayloadDto {
    return jwtDecode<JwtPayloadDto>(token);
  }
}
