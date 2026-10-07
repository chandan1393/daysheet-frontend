import { Component, OnInit } from '@angular/core';
import { ToastService } from '../core/services/toast.service';
import { toDateStr } from '../core/utils/dates';
import { errorMessage } from '../core/utils/errors';
import { listStagger } from '../shared/animations';
import { AdminApiService, AdminPaymentRow, rupees, shortDate } from './admin-api.service';

@Component({
  selector: 'app-admin-payments',
  standalone: false,
  styleUrls: ['./admin.scss'],
  animations: [listStagger],
  template: `
    <div class="head">
      <div><h1>Payments & GST</h1><p>Every paid invoice. Download the CSV for your CA to file GSTR-1.</p></div>
      <button class="btn btn-primary" (click)="download()" [disabled]="downloading" appRipple>
        @if (downloading) { <span class="spinner"></span> } @else { <app-icon name="download" [size]="16" /> } Download GST report
      </button>
    </div>

    <div class="toolbar">
      <div class="seg" [appSegMarker]="range">
        <span class="marker"></span>
        <button [class.on]="range === 'month'" (click)="preset('month')">This month</button>
        <button [class.on]="range === 'last'" (click)="preset('last')">Last month</button>
        <button [class.on]="range === 'fy'" (click)="preset('fy')">This financial year</button>
      </div>
      <label class="dates">From <input class="input" type="date" [(ngModel)]="from" (change)="range = 'custom'; load()"></label>
      <label class="dates">To <input class="input" type="date" [(ngModel)]="to" (change)="range = 'custom'; load()"></label>
    </div>

    <div class="kpis three">
      <div class="kpi dark"><span>Total collected</span><strong [appCountUp]="total / 100" [format]="money"></strong><em>{{ rows.length }} invoices</em></div>
      <div class="kpi"><span>Through Razorpay</span><strong>{{ rupees(sum('RAZORPAY')) }}</strong></div>
      <div class="kpi"><span>By bank transfer</span><strong>{{ rupees(sum('MANUAL')) }}</strong></div>
    </div>

    <section class="panel">
      @if (loading) {
        <div style="padding: 16px">@for (i of [1, 2, 3]; track i) { <div class="skeleton" style="height: 44px; margin-bottom: 8px"></div> }</div>
      } @else if (error) {
        <app-empty-state icon="alert" title="Couldn't load payments" [text]="error" />
      } @else if (!rows.length) {
        <app-empty-state icon="receipt" title="No payments in this period" />
      } @else {
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>Invoice</th><th>Date</th><th>Practice</th><th>Plan</th><th>Method</th><th class="num">Amount</th><th></th></tr></thead>
            <tbody [@listStagger]="rows.length">
              @for (p of rows; track p.id) {
                <tr>
                  <td class="mono">{{ p.invoiceNumber }}</td>
                  <td class="muted">{{ date(p.invoiceDate) }}</td>
                  <td><strong>{{ p.practiceName }}</strong></td>
                  <td>{{ p.planName }}</td>
                  <td><span class="pill" [class]="p.method">{{ p.method === 'MANUAL' ? 'Bank transfer' : 'Razorpay' }}</span><span class="sub mono">{{ p.reference }}</span></td>
                  <td class="num"><strong>{{ rupees(p.amountPaise, 2) }}</strong></td>
                  <td class="num"><button class="btn btn-sm" (click)="invoiceId = p.id">Invoice</button></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>

    <app-modal [open]="invoiceId !== null" title="Invoice" width="780px" (closed)="invoiceId = null">
      @if (invoiceId !== null) { <app-tax-invoice [paymentId]="invoiceId" [admin]="true" /> }
    </app-modal>`,
  styles: [`
    .three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    @media (max-width: 700px) { .three { grid-template-columns: 1fr; } }
    .dates { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--muted); }
    .dates .input { width: 160px; height: 36px; }
  `]
})
export class AdminPaymentsComponent implements OnInit {
  rows: AdminPaymentRow[] = [];
  loading = true;
  error = '';
  range: 'month' | 'last' | 'fy' | 'custom' = 'month';
  from = '';
  to = '';
  downloading = false;
  invoiceId: number | null = null;
  readonly rupees = rupees;
  readonly date = shortDate;
  readonly money = (n: number) => rupees(n * 100);

  constructor(private api: AdminApiService, private toast: ToastService) {}

  ngOnInit(): void { this.preset('month'); }

  preset(r: 'month' | 'last' | 'fy'): void {
    this.range = r;
    const now = new Date();
    if (r === 'month') {
      this.from = toDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
      this.to = toDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    } else if (r === 'last') {
      this.from = toDateStr(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      this.to = toDateStr(new Date(now.getFullYear(), now.getMonth(), 0));
    } else {
      const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      this.from = toDateStr(new Date(startYear, 3, 1));
      this.to = toDateStr(new Date(startYear + 1, 2, 31));
    }
    this.load();
  }

  load(): void {
    if (!this.from || !this.to) return;
    this.loading = true;
    this.api.payments(this.from, this.to).subscribe({
      next: r => { this.rows = r; this.loading = false; this.error = ''; },
      error: e => { this.loading = false; this.error = errorMessage(e); }
    });
  }

  get total(): number { return this.rows.reduce((t, p) => t + p.amountPaise, 0); }
  sum(method: string): number { return this.rows.filter(p => p.method === method).reduce((t, p) => t + p.amountPaise, 0); }

  download(): void {
    this.downloading = true;
    this.api.gstReport(this.from, this.to).subscribe({
      next: blob => {
        this.downloading = false;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gst-${this.from}-to-${this.to}.csv`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      error: e => { this.downloading = false; this.toast.error(errorMessage(e)); }
    });
  }
}
