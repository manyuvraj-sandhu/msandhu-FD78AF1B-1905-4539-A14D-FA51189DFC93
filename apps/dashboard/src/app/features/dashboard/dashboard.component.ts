import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <!-- Mobile menu button -->
      <div class="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-md z-10 p-4">
        <button (click)="sidebarOpen = !sidebarOpen" class="text-gray-600 dark:text-gray-300">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </div>

      <!-- Sidebar -->
      <div
        class="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out z-20"
        [class.-translate-x-full]="!sidebarOpen"
        [class.md:translate-x-0]="true"
      >
        <div class="flex flex-col h-full">
          <div class="p-6 border-b dark:border-gray-700">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">TaskManager</h1>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1" *ngIf="currentUser$ | async as user">
              {{ user.email }}
            </p>
          </div>

          <nav class="flex-1 p-4 space-y-2">
            <a
              routerLink="/dashboard/tasks"
              routerLinkActive="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
              class="flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              (click)="closeMobileSidebar()"
            >
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
              Tasks
            </a>

            <a
              *ngIf="isOwner"
              routerLink="/dashboard/audit"
              routerLinkActive="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
              class="flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              (click)="closeMobileSidebar()"
            >
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Audit Log
            </a>
          </nav>

          <div class="p-4 border-t dark:border-gray-700 space-y-2">
            <button
              (click)="toggleTheme()"
              class="w-full flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
              </svg>
              {{ (theme$ | async) === 'dark' ? 'Light Mode' : 'Dark Mode' }}
            </button>

            <button
              (click)="logout()"
              class="w-full flex items-center px-4 py-2 text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition"
            >
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      <!-- Backdrop for mobile -->
      <div
        *ngIf="sidebarOpen"
        class="md:hidden fixed inset-0 bg-black bg-opacity-50 z-10"
        (click)="sidebarOpen = false"
      ></div>

      <!-- Main content -->
      <div class="md:ml-64 pt-16 md:pt-0">
        <div class="p-4 md:p-8">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent {
  sidebarOpen = false;
  currentUser$;
  theme$;

  constructor(
    private authService: AuthService,
    private themeService: ThemeService
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.theme$ = this.themeService.theme$;
  }

  get isOwner(): boolean {
    return this.authService.hasRole('owner');
  }

  logout(): void {
    this.authService.logout();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  closeMobileSidebar(): void {
    if (window.innerWidth < 768) {
      this.sidebarOpen = false;
    }
  }
}
