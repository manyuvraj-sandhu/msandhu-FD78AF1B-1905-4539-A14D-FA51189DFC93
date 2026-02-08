import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

interface AuditLog {
  id: string;
  userId: string;
  organizationId: string;
  action: string;
  resource: string;
  resourceId: string;
  details?: string;
  previousState?: string;
  newState?: string;
  timestamp: Date;
}

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Audit Log</h1>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Timestamp
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Action
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Resource
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Previous State
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  New State
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr *ngFor="let log of auditLogs$ | async" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ log.timestamp | date:'short' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="px-2 py-1 text-xs font-semibold rounded-full"
                    [class.bg-green-100]="log.action === 'CREATE'"
                    [class.text-green-800]="log.action === 'CREATE'"
                    [class.bg-blue-100]="log.action === 'UPDATE'"
                    [class.text-blue-800]="log.action === 'UPDATE'"
                    [class.bg-red-100]="log.action === 'DELETE'"
                    [class.text-red-800]="log.action === 'DELETE'"
                  >
                    {{ log.action }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ log.resource }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                  <div *ngIf="log.previousState" class="space-y-1">
                    <div *ngFor="let item of parseState(log.previousState) | keyvalue" class="text-xs">
                      <span class="font-medium">{{ item.key }}:</span> {{ item.value }}
                    </div>
                  </div>
                  <span *ngIf="!log.previousState" class="text-gray-400 italic">—</span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                  <div *ngIf="log.newState" class="space-y-1">
                    <div *ngFor="let item of parseState(log.newState) | keyvalue" class="text-xs">
                      <span class="font-medium">{{ item.key }}:</span> {{ item.value }}
                    </div>
                  </div>
                  <span *ngIf="!log.newState" class="text-gray-400 italic">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div *ngIf="(auditLogs$ | async)?.length === 0" class="p-8 text-center text-gray-500 dark:text-gray-400">
          No audit logs found.
        </div>
      </div>
    </div>
  `
})
export class AuditLogComponent implements OnInit {
  auditLogs$!: Observable<AuditLog[]>;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.auditLogs$ = this.http.get<AuditLog[]>(`${environment.apiUrl}/audit-log`);
  }

  parseState(stateJson: string): Record<string, any> {
    try {
      return JSON.parse(stateJson);
    } catch {
      return {};
    }
  }
}
