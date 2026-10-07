import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { ConfirmService } from '../core/services/confirm.service';
import { ToastService } from '../core/services/toast.service';
import { AuthService } from '../core/services/auth.service';
import { Appointment, AppointmentStatus } from '../core/models';
import { errorMessage } from '../core/utils/errors';
import { parseLocal } from '../core/utils/dates';
import { PortalUiService } from './portal-ui.service';

@Component({
  selector: 'app-appointment-details',
  standalone: false,
  template: `
    <div class="head" [style.--c]="appointment.color">
      <span class="bar"></span>
      <div class="titles">
        <p class="service">{{ appointment.serviceName }}</p>
        <h2><a (click)="openClient()">{{ appointment.clientName }}</a></h2>
        <p class="when">
          {{ appointment.startAt | dayLabel }}, {{ appointment.startAt | hm }} to {{ appointment.endAt | hm }}
          <span class="faint">({{ appointment.durationMinutes | duration }})</span>
        </p>
      </div>
      <button class="btn btn-ghost btn-icon btn-sm close" (click)="closed.emit()" aria-label="Close"><app-icon name="x" /></button>
    </div>

    <div class="facts">
      <app-status-pill [status]="appointment.status" />
      @if (appointment.source === 'ONLINE') { <span class="chip"><app-icon name="globe" [size]="13" />Booked online</span> }
      @if (appointment.invoiced) { <span class="chip"><app-icon name="receipt" [size]="13" />Invoiced</span> }
      @if (appointment.packageName) { <span class="chip pkg"><app-icon name="package" [size]="13" />{{ appointment.packageName }}: {{ appointment.packageUsed }} of {{ appointment.packageTotal }} used</span> }
      <span class="spacer"></span>
      <strong class="price">{{ appointment.price | money }}</strong>
    </div>

    @if (appointment.notes) { <p class="notes">{{ appointment.notes }}</p> }

    <p class="label">Status</p>
    <div class="statuses">
      @for (s of statuses; track s.value) {
        <button class="st" [class.on]="appointment.status === s.value" [attr.data-s]="s.value"
                [disabled]="busy" (click)="setStatus(s.value)">
          <app-icon [name]="s.icon" [size]="15" [stroke]="2.4" />{{ s.label }}
        </button>
      }
    </div>

    @if (appointment.status !== 'CANCELLED') {
      <app-visit-record [appointment]="appointment" />
    }

    @if (appointment.clientPhone) {
      <div class="contact">
        <a class="btn btn-sm" [href]="'tel:' + appointment.clientPhone"><app-icon name="phone" [size]="15" />Call</a>
        <a class="btn btn-sm" [href]="whatsapp" target="_blank" rel="noopener"><app-icon name="message" [size]="15" />WhatsApp reminder</a>
      </div>
    }

    <div class="actions">
      <button class="btn btn-danger btn-sm" (click)="remove()" [disabled]="busy"><app-icon name="trash" [size]="15" />Delete</button>
      <span class="spacer"></span>
      <button class="btn btn-sm" (click)="ui.editAppointment(appointment)"><app-icon name="edit" [size]="15" />Edit</button>
      @if (!appointment.invoiced && appointment.status !== 'CANCELLED') {
        <button class="btn btn-primary btn-sm" (click)="invoice()" [disabled]="busy" appRipple>
          <app-icon name="receipt" [size]="15" />Create invoice
        </button>
      }
    </div>`,
  styles: [`
    .head { --c: var(--lagoon); display: flex; gap: 14px; align-items: flex-start; margin: 4px 0 18px; }
    .bar { width: 6px; align-self: stretch; border-radius: 6px; background: var(--c); }
    .titles { flex: 1; min-width: 0; }
    .service { font-size: 13px; font-weight: 600; color: color-mix(in srgb, var(--c) 75%, var(--ink)); }
    h2 { font-size: 24px; margin: 2px 0 4px; }
    h2 a { color: var(--ink); cursor: pointer; }
    .when { color: var(--muted); font-size: 14px; }
    .facts { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 12px 0; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
    .price { font-family: var(--font-display); font-size: 20px; color: var(--ink); }
    .chip.pkg { background: var(--iris-wash); color: #4B3CC9; }
    .notes { background: var(--paper); border-radius: 12px; padding: 10px 12px; margin-top: 14px; font-size: 14px; white-space: pre-line; }
    .label { margin: 18px 0 8px; }
    .statuses { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
    .st {
      display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 4px; border-radius: 12px;
      border: 1px solid var(--line-strong); background: var(--surface); cursor: pointer; font-size: 12.5px; font-weight: 600; color: var(--muted);
      transition: all .2s var(--ease-out);
    }
    .st:hover { color: var(--ink); border-color: var(--ink-3); }
    .st.on { transform: translateY(-2px); box-shadow: var(--shadow-2); }
    .st.on[data-s="CONFIRMED"] { background: var(--lagoon); border-color: var(--lagoon); color: #fff; }
    .st.on[data-s="COMPLETED"] { background: var(--sage); border-color: var(--sage); color: #fff; }
    .st.on[data-s="NO_SHOW"] { background: var(--rose); border-color: var(--rose); color: #fff; }
    .st.on[data-s="CANCELLED"] { background: var(--ink-3); border-color: var(--ink-3); color: #fff; }
    .contact { display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap; }
    .actions { display: flex; align-items: center; gap: 8px; margin-top: 22px; flex-wrap: wrap; }
  `]
})
export class AppointmentDetailsComponent {
  @Input({ required: true }) appointment!: Appointment;
  @Output() changed = new EventEmitter<Appointment | null>();
  @Output() closed = new EventEmitter<void>();

  busy = false;

  readonly statuses: { value: AppointmentStatus; label: string; icon: string }[] = [
    { value: 'CONFIRMED', label: 'Confirmed', icon: 'check' },
    { value: 'COMPLETED', label: 'Seen', icon: 'sparkle' },
    { value: 'NO_SHOW', label: 'No-show', icon: 'alert' },
    { value: 'CANCELLED', label: 'Cancelled', icon: 'x' }
  ];

  constructor(private api: ApiService, public ui: PortalUiService, private toast: ToastService,
              private confirm: ConfirmService, private router: Router, private auth: AuthService) {}

  get whatsapp(): string {
    const digits = (this.appointment.clientPhone ?? '').replace(/\D/g, '');
    const when = parseLocal(this.appointment.startAt);
    const text = `Hi ${this.appointment.clientName.split(' ')[0]}, a reminder of your ${this.appointment.serviceName.toLowerCase()} `
      + `with ${this.auth.workspace?.name ?? 'us'} on ${when.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })} `
      + `at ${when.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}. Reply if you need to change it.`;
    return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
  }

  setStatus(status: AppointmentStatus): void {
    const next: AppointmentStatus = this.appointment.status === status ? 'SCHEDULED' : status;
    this.busy = true;
    this.api.setAppointmentStatus(this.appointment.id, next).subscribe({
      next: a => { this.busy = false; this.appointment = a; this.changed.emit(a); },
      error: err => { this.busy = false; this.toast.error(errorMessage(err)); }
    });
  }

  invoice(): void {
    this.busy = true;
    this.api.invoiceFromAppointment(this.appointment.id).subscribe({
      next: inv => {
        this.busy = false;
        this.toast.success(`Invoice ${inv.number} created.`);
        this.ui.notifyChanged();
        this.ui.showInvoice(inv.id);
      },
      error: err => { this.busy = false; this.toast.error(errorMessage(err)); }
    });
  }

  async remove(): Promise<void> {
    const ok = await this.confirm.ask('Delete this appointment?',
      `${this.appointment.clientName}'s ${this.appointment.serviceName.toLowerCase()} will be removed from your calendar.`, 'Delete');
    if (!ok) return;
    this.busy = true;
    this.api.deleteAppointment(this.appointment.id).subscribe({
      next: () => { this.busy = false; this.toast.success('Appointment deleted.'); this.changed.emit(null); },
      error: err => { this.busy = false; this.toast.error(errorMessage(err)); }
    });
  }

  openClient(): void {
    this.closed.emit();
    this.router.navigate(['/app/clients', this.appointment.clientId]);
  }
}
