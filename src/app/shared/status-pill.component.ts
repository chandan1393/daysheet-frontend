import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

const LABELS: Record<string, string> = {
  SCHEDULED: 'Scheduled', CONFIRMED: 'Confirmed', COMPLETED: 'Completed', CANCELLED: 'Cancelled',
  NO_SHOW: 'No-show', DRAFT: 'Draft', SENT: 'Unpaid', PAID: 'Paid', VOID: 'Void', OVERDUE: 'Overdue'
};

@Component({
  selector: 'app-status-pill',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="pill" [class]="key.toLowerCase()"><i></i>{{ label }}</span>`,
  styles: [`
    .pill { display: inline-flex; align-items: center; gap: 6px; height: 24px; padding: 0 10px 0 8px; border-radius: 99px; font-size: 12px; font-weight: 600; white-space: nowrap; }
    i { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
    .scheduled { background: var(--sky-wash); color: #1F5FC7; }
    .confirmed { background: var(--lagoon-wash); color: var(--lagoon-deep); }
    .completed, .paid { background: var(--sage-wash); color: #2F6E47; }
    .cancelled, .void, .draft { background: #EDF0F5; color: var(--muted); }
    .no_show, .overdue { background: var(--rose-wash); color: #B22A58; }
    .sent { background: var(--marigold-wash); color: var(--marigold-deep); }
  `]
})
export class StatusPillComponent {
  @Input() status = '';
  @Input() overdue = false;

  get key(): string { return this.overdue ? 'OVERDUE' : this.status; }
  get label(): string { return LABELS[this.key] ?? this.key; }
}
