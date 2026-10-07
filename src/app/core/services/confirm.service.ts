import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel: string;
  danger: boolean;
  resolve: (ok: boolean) => void;
}

/** Promise-based replacement for window.confirm, rendered by <app-confirm-host>. */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly request$ = new BehaviorSubject<ConfirmRequest | null>(null);

  ask(title: string, message: string, confirmLabel = 'Confirm', danger = true): Promise<boolean> {
    return new Promise(resolve => {
      this.request$.next({
        title, message, confirmLabel, danger,
        resolve: ok => { this.request$.next(null); resolve(ok); }
      });
    });
  }
}
