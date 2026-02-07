import { Injectable } from '@angular/core';
import { fromEvent, filter, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KeyboardService {
  private shortcuts = new Map<string, () => void>();
  private subscription: any;

  constructor() {
    this.subscription = fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(
        filter(e => e.ctrlKey || e.metaKey),
        tap(e => {
          const handler = this.shortcuts.get(e.key.toLowerCase());
          if (handler) {
            e.preventDefault();
            handler();
          }
        })
      )
      .subscribe();
  }

  registerShortcut(key: string, handler: () => void): void {
    this.shortcuts.set(key, handler);
  }

  unregisterShortcut(key: string): void {
    this.shortcuts.delete(key);
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
