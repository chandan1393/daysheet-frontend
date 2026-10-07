import { Component, OnInit } from '@angular/core';
import { ApiService } from '../core/services/api.service';
import { ConfirmService } from '../core/services/confirm.service';
import { ToastService } from '../core/services/toast.service';
import { GstState } from '../core/models';
import { errorMessage } from '../core/utils/errors';
import { listStagger } from '../shared/animations';
import { AdminApiService, AdminPlan, PracticeDetail, PracticeRow, rupees, shortDate } from './admin-api.service';

@Component({
  selector: 'app-admin-practices',
  standalone: false,
  templateUrl: './practices.component.html',
  styleUrls: ['./admin.scss', './practices.component.scss'],
  animations: [listStagger]
})
export class AdminPracticesComponent implements OnInit {
  rows: PracticeRow[] = [];
  loading = true;
  error = '';
  q = '';
  status = 'ALL';
  readonly statuses = [
    { key: 'ALL', label: 'All' }, { key: 'TRIAL', label: 'Trial' }, { key: 'ACTIVE', label: 'Paying' },
    { key: 'EXPIRED', label: 'Expired' }, { key: 'UNVERIFIED', label: 'Unverified' }, { key: 'SUSPENDED', label: 'Suspended' }
  ];

  detail?: PracticeDetail;
  drawerOpen = false;
  busy = false;
  invoiceId: number | null = null;

  plans: AdminPlan[] = [];
  states: GstState[] = [];
  extendDays = 15;
  extendNote = '';
  pay = { planCode: '', amountRupees: 0, reference: '', billingStateCode: '' };
  suspendReason = '';

  readonly rupees = rupees;
  readonly date = shortDate;
  private debounce?: ReturnType<typeof setTimeout>;

  constructor(private api: AdminApiService, private core: ApiService, private toast: ToastService, private confirm: ConfirmService) {}

  ngOnInit(): void {
    this.load();
    this.api.plans().subscribe(p => this.plans = p.filter(x => x.active));
    this.core.gstStates().subscribe(s => this.states = s);
  }

  load(): void {
    this.api.practices(this.q.trim(), this.status).subscribe({
      next: r => { this.rows = r; this.loading = false; this.error = ''; },
      error: e => { this.loading = false; this.error = errorMessage(e); }
    });
  }

  onSearch(): void {
    clearTimeout(this.debounce);
    this.debounce = setTimeout(() => this.load(), 250);
  }

  setStatus(s: string): void { this.status = s; this.load(); }

  open(row: PracticeRow): void {
    this.drawerOpen = true;
    this.detail = undefined;
    this.suspendReason = '';
    this.api.practice(row.id).subscribe({ next: d => this.show(d), error: e => this.toast.error(errorMessage(e)) });
  }

  private show(d: PracticeDetail): void {
    this.detail = d;
    const first = this.plans[0];
    this.pay = { planCode: first?.code ?? '', amountRupees: first ? first.amountPaise / 100 : 0, reference: '', billingStateCode: '' };
  }

  onPlanChange(): void {
    const p = this.plans.find(x => x.code === this.pay.planCode);
    if (p) this.pay.amountRupees = p.amountPaise / 100;
  }

  extend(): void {
    if (!this.detail || this.extendDays < 1) return;
    this.busy = true;
    this.api.extend(this.detail.practice.id, this.extendDays, this.extendNote).subscribe({
      next: d => { this.busy = false; this.show(d); this.extendNote = ''; this.toast.success(`Added ${this.extendDays} days.`); this.load(); },
      error: e => { this.busy = false; this.toast.error(errorMessage(e)); }
    });
  }

  async recordPayment(): Promise<void> {
    if (!this.detail) return;
    if (!this.pay.reference.trim()) { this.toast.error('Enter the UTR or transaction reference.'); return; }
    const plan = this.plans.find(p => p.code === this.pay.planCode);
    const ok = await this.confirm.ask('Record this payment?',
      `${rupees(this.pay.amountRupees * 100)} for the ${plan?.name ?? ''} plan from ${this.detail.practice.name}. A GST invoice will be emailed to them and their plan extended.`,
      'Record payment', false);
    if (!ok) return;
    this.busy = true;
    this.api.recordPayment(this.detail.practice.id, { ...this.pay, reference: this.pay.reference.trim() }).subscribe({
      next: d => { this.busy = false; this.show(d); this.toast.success('Payment recorded and invoice sent.'); this.load(); },
      error: e => { this.busy = false; this.toast.error(errorMessage(e)); }
    });
  }

  async toggleSuspend(): Promise<void> {
    if (!this.detail) return;
    const suspend = !this.detail.practice.suspended;
    const ok = await this.confirm.ask(suspend ? `Suspend ${this.detail.practice.name}?` : `Restore ${this.detail.practice.name}?`,
      suspend ? 'They will be signed out, can\'t log in, and their booking page stops taking bookings. Nothing is deleted.'
        : 'They can log in and take bookings again.',
      suspend ? 'Suspend' : 'Restore', suspend);
    if (!ok) return;
    this.busy = true;
    this.api.suspend(this.detail.practice.id, suspend, this.suspendReason).subscribe({
      next: d => { this.busy = false; this.show(d); this.toast.success(suspend ? 'Practice suspended.' : 'Practice restored.'); this.load(); },
      error: e => { this.busy = false; this.toast.error(errorMessage(e)); }
    });
  }

  storage(bytes: number): string {
    return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  statusLabel(r: PracticeRow): string {
    if (r.suspended) return 'Suspended';
    if (!r.emailVerified) return 'Email not verified';
    return r.status === 'ACTIVE' ? 'Paying' : r.status === 'TRIAL' ? 'Trial' : 'Expired';
  }
}
