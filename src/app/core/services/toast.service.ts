import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  kind: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  readonly toasts$ = new BehaviorSubject<Toast[]>([]);

  success(message: string): void { this.push(message, 'success'); }
  error(message: string): void { this.push(message, 'error', 5500); }
  info(message: string): void { this.push(message, 'info'); }

  dismiss(id: number): void {
    this.toasts$.next(this.toasts$.value.filter(t => t.id !== id));
  }

  private push(message: string, kind: Toast['kind'], ttl = 3500): void {
    const toast = { id: this.nextId++, message, kind };
    this.toasts$.next([...this.toasts$.value.slice(-3), toast]);
    setTimeout(() => this.dismiss(toast.id), ttl);
  }
}
