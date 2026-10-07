import { Component, OnInit } from '@angular/core';
import { ACTION_LABELS, AdminApiService, Overview, rupees, shortDate } from './admin-api.service';
import { errorMessage } from '../core/utils/errors';
import { listStagger } from '../shared/animations';

@Component({
  selector: 'app-admin-overview',
  standalone: false,
  styleUrls: ['./admin.scss'],
  animations: [listStagger],
  template: `
    <div class="head">
      <div><h1>Overview</h1><p>How Daysheet is doing today.</p></div>
      <button class="btn btn-sm" (click)="load()"><app-icon name="repeat" [size]="15" />Refresh</button>
    </div>

    @if (error) {
      <section class="panel"><app-empty-state icon="alert" title="Couldn't load the overview" [text]="error" /></section>
    } @else if (!o) {
      <div class="kpis">@for (i of [1, 2, 3, 4]; track i) { <div class="skeleton" style="height: 96px"></div> }</div>
    } @else {
      <div class="kpis" [@listStagger]="4">
        <div class="kpi dark"><span>Revenue this month</span><strong [appCountUp]="o.revenueThisMonthPaise / 100" [format]="money"></strong><em>{{ rupeesFmt(o.revenueThisYearPaise) }} this financial year</em></div>
        <div class="kpi"><span>Paying practices</span><strong [appCountUp]="o.activePaid"></strong><em>{{ o.inTrial }} in free trial</em></div>
        <div class="kpi"><span>New signups</span><strong [appCountUp]="o.signups7d"></strong><em>last 7 days, {{ o.signups30d }} in 30 days</em></div>
        <div class="kpi"><span>All practices</span><strong [appCountUp]="o.practices"></strong><em>{{ o.expired }} expired, {{ o.suspended }} suspended</em></div>
      </div>

      <div class="grid2">
        <section class="panel">
          <div class="panel-head"><h3>Latest payments</h3><a routerLink="/admin/payments" class="small">All payments</a></div>
          @if (!o.recentPayments.length) { <p class="muted pad">No payments yet.</p> }
          <ul class="list">
            @for (p of o.recentPayments; track p.id) {
              <li>
                <span class="grow"><strong>{{ p.practiceName }}</strong><span class="sub">{{ p.planName }}, {{ date(p.paidAt) }}</span></span>
                <span class="pill" [class]="p.method">{{ p.method === 'MANUAL' ? 'Bank' : 'Razorpay' }}</span>
                <strong class="amt">{{ rupeesFmt(p.amountPaise) }}</strong>
              </li>
            }
          </ul>
        </section>

        <section class="panel">
          <div class="panel-head"><h3>Newest practices</h3><a routerLink="/admin/practices" class="small">All practices</a></div>
          <ul class="list">
            @for (p of o.recentPractices; track p.id) {
              <li>
                <app-avatar [name]="p.name" [size]="32" />
                <span class="grow"><strong>{{ p.name }}</strong><span class="sub">{{ p.profession }}, joined {{ date(p.createdAt) }}</span></span>
                <span class="pill" [class]="p.suspended ? 'SUSPENDED' : p.status">{{ p.suspended ? 'Suspended' : p.status | titlecase }}</span>
              </li>
            }
          </ul>
        </section>
      </div>

      <section class="panel activity">
        <div class="panel-head"><h3>Recent admin activity</h3><a routerLink="/admin/admins" class="small">Full log</a></div>
        <ul class="list">
          @for (a of o.recentActivity; track a.id) {
            <li><span class="grow"><strong>{{ label(a.action) }}</strong>@if (a.details) { <span class="sub">{{ a.details }}</span> }</span>
              <span class="sub right">{{ a.adminEmail }}<br>{{ dateTime(a.createdAt) }}</span></li>
          }
        </ul>
      </section>
    }`,
  styles: [`
    .grow { flex: 1; min-width: 0; strong { color: var(--ink); } }
    .amt { font-variant-numeric: tabular-nums; }
    .pad { padding: 18px 20px; }
    .activity { margin-top: 16px; }
    .right { text-align: right; }
    .small { font-size: 13px; font-weight: 600; }
  `]
})
export class AdminOverviewComponent implements OnInit {
  o?: Overview;
  error = '';
  readonly money = (n: number) => rupees(n * 100);
  readonly rupeesFmt = rupees;
  readonly date = shortDate;

  constructor(private api: AdminApiService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.api.overview().subscribe({ next: o => { this.o = o; this.error = ''; }, error: e => this.error = errorMessage(e) });
  }

  label(action: string): string { return ACTION_LABELS[action] ?? action; }

  dateTime(v: string): string {
    return new Date(v).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  }
}
