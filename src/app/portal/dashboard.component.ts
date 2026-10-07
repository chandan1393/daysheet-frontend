import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { AuthService } from '../core/services/auth.service';
import { ToastService } from '../core/services/toast.service';
import { Appointment, AppointmentStatus, Dashboard } from '../core/models';
import { greeting, parseLocal } from '../core/utils/dates';
import { errorMessage } from '../core/utils/errors';
import { listStagger } from '../shared/animations';
import { MoneyPipe } from '../shared/pipes';
import { PortalUiService } from './portal-ui.service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  animations: [listStagger]
})
export class DashboardComponent implements OnInit, OnDestroy {
  /** For highlighting hearings today or tomorrow. */
  readonly tomorrowStr = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();

  data?: Dashboard;
  error = '';
  now = new Date();
  busyId: number | null = null;

  readonly hello = greeting();
  readonly dateLine = new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
  readonly moneyFmt = (n: number) => this.money.transform(n);
  readonly intFmt = (n: number) => Math.round(n).toLocaleString();
  readonly pctFmt = (n: number) => `${n.toFixed(1)}%`;

  private money: MoneyPipe;
  private subs: Subscription[] = [];
  private clock?: ReturnType<typeof setInterval>;

  constructor(private api: ApiService, public auth: AuthService, public ui: PortalUiService, private toast: ToastService) {
    this.money = new MoneyPipe(auth);
  }

  ngOnInit(): void {
    this.load();
    this.subs.push(this.ui.changed$.subscribe(() => this.load()));
    this.clock = setInterval(() => this.now = new Date(), 60_000);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    clearInterval(this.clock);
  }

  load(): void {
    this.api.dashboard().subscribe({
      next: d => { this.data = d; this.error = ''; },
      error: err => this.error = errorMessage(err, 'Could not load your day.')
    });
  }

  get firstName(): string { return (this.auth.user?.fullName ?? '').split(' ')[0]; }

  get revenueDelta(): number | null {
    const s = this.data?.stats;
    if (!s || !s.lastMonthRevenue) return null;
    return ((s.monthRevenue - s.lastMonthRevenue) / s.lastMonthRevenue) * 100;
  }

  /** Index in today's list after which the "now" line sits; -1 = before the first. */
  get nowIndex(): number {
    const list = this.data?.today ?? [];
    let idx = -1;
    list.forEach((a, i) => { if (parseLocal(a.startAt) <= this.now) idx = i; });
    return idx;
  }

  isPast(a: Appointment): boolean { return parseLocal(a.endAt) < this.now; }
  isCurrent(a: Appointment): boolean { return parseLocal(a.startAt) <= this.now && parseLocal(a.endAt) > this.now; }
  isOpen(a: Appointment): boolean { return a.status === 'SCHEDULED' || a.status === 'CONFIRMED'; }

  setStatus(a: Appointment, status: AppointmentStatus, event: Event): void {
    event.stopPropagation();
    this.busyId = a.id;
    this.api.setAppointmentStatus(a.id, status).subscribe({
      next: () => {
        this.busyId = null;
        this.toast.success(status === 'COMPLETED' ? `Marked ${a.clientName} as seen.` : `Marked ${a.clientName} as a no-show.`);
        this.load();
      },
      error: err => { this.busyId = null; this.toast.error(errorMessage(err)); }
    });
  }

  invoice(a: Appointment, event: Event): void {
    event.stopPropagation();
    this.busyId = a.id;
    this.api.invoiceFromAppointment(a.id).subscribe({
      next: inv => {
        this.busyId = null;
        this.toast.success(`Invoice ${inv.number} created.`);
        this.load();
        this.ui.showInvoice(inv.id);
      },
      error: err => { this.busyId = null; this.toast.error(errorMessage(err)); }
    });
  }

  copyLink(): void {
    const url = `${location.origin}/book/${this.auth.workspace?.slug ?? ''}`;
    navigator.clipboard?.writeText(url).then(() => this.toast.success('Booking link copied.'));
  }
}
