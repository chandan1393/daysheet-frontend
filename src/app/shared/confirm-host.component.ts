import { Component } from '@angular/core';
import { ConfirmService } from '../core/services/confirm.service';

@Component({
  selector: 'app-confirm-host',
  standalone: false,
  template: `
    @let req = confirm.request$ | async;
    <app-modal [open]="!!req" [title]="req?.title ?? ''" width="420px" (closed)="req?.resolve(false)">
      @if (req) {
        <p class="msg">{{ req.message }}</p>
        <div class="actions">
          <button class="btn" (click)="req.resolve(false)">Keep it</button>
          <button class="btn" [class.btn-danger]="req.danger" [class.btn-primary]="!req.danger"
                  (click)="req.resolve(true)">{{ req.confirmLabel }}</button>
        </div>
      }
    </app-modal>`,
  styles: [`
    .msg { color: var(--muted); }
    .actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }
  `]
})
export class ConfirmHostComponent {
  constructor(public confirm: ConfirmService) {}
}
