import { Component } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'app-toast-host',
  standalone: false,
  template: `
    <div class="host" aria-live="polite">
      @for (t of toast.toasts$ | async; track t.id) {
        <div class="toast" [class]="t.kind" @toast (click)="toast.dismiss(t.id)">
          <span class="dot">
            <app-icon [name]="t.kind === 'error' ? 'alert' : t.kind === 'success' ? 'check' : 'sparkle'" [size]="14" [stroke]="2.6" />
          </span>
          <span>{{ t.message }}</span>
        </div>
      }
    </div>`,
  styles: [`
    .host { position: fixed; bottom: 22px; left: 50%; transform: translateX(-50%); z-index: 120; display: flex; flex-direction: column; gap: 8px; align-items: center; pointer-events: none; }
    .toast {
      pointer-events: auto; cursor: pointer; display: flex; align-items: center; gap: 10px;
      padding: 10px 16px 10px 10px; border-radius: 14px; background: var(--ink); color: #fff;
      box-shadow: var(--shadow-3); font-size: 14px; font-weight: 500; max-width: min(520px, 92vw);
    }
    .dot { width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; flex-shrink: 0; background: var(--lagoon); }
    .error .dot { background: var(--rose); }
    .info .dot { background: var(--marigold); color: var(--ink); }
  `],
  animations: [
    trigger('toast', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px) scale(.9)' }),
        animate('380ms cubic-bezier(.34,1.5,.64,1)', style({ opacity: 1, transform: 'none' }))
      ]),
      transition(':leave', [animate('200ms ease-in', style({ opacity: 0, transform: 'scale(.92)' }))])
    ])
  ]
})
export class ToastHostComponent {
  constructor(public toast: ToastService) {}
}
