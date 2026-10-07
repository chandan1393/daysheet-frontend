import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { InvoiceSummary } from '../core/models';
import { parseLocal } from '../core/utils/dates';
import { errorMessage } from '../core/utils/errors';
import { listStagger } from '../shared/animations';
import { PortalUiService } from './portal-ui.service';

type Filter = 'all' | 'unpaid' | 'overdue' | 'paid' | 'draft';

@Component({
  selector: 'app-invoices',
  standalone: false,
  templateUrl: './invoices.component.html',
  styleUrl: './invoices.component.scss',
  animations: [listStagger]
})
export class InvoicesComponent implements OnInit, OnDestroy {
  invoices: InvoiceSummary[] = [];
  loading = true;
  error = '';
  filter: Filter = 'all';
  query = '';

  readonly filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' }, { key: 'unpaid', label: 'Unpaid' }, { key: 'overdue', label: 'Overdue' },
    { key: 'paid', label: 'Paid' }, { key: 'draft', label: 'Drafts' }
  ];

  private subs: Subscription[] = [];

  constructor(private api: ApiService, private route: ActivatedRoute, public ui: PortalUiService) {}

  ngOnInit(): void {
    const f = this.route.snapshot.queryParamMap.get('filter') as Filter | null;
    if (f && this.filters.some(x => x.key === f)) this.filter = f;
    this.load();
    this.subs.push(this.ui.changed$.subscribe(() => this.load()));
  }

  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }

  load(): void {
    this.api.invoices().subscribe({
      next: list => { this.invoices = list; this.loading = false; this.error = ''; },
      error: err => { this.loading = false; this.error = errorMessage(err); }
    });
  }

  get visible(): InvoiceSummary[] {
    const q = this.query.trim().toLowerCase();
    return this.invoices.filter(i => {
      const matchesFilter = this.filter === 'all'
        || (this.filter === 'unpaid' && i.status === 'SENT')
        || (this.filter === 'overdue' && i.overdue)
        || (this.filter === 'paid' && i.status === 'PAID')
        || (this.filter === 'draft' && i.status === 'DRAFT');
      return matchesFilter && (!q || i.clientName.toLowerCase().includes(q) || i.number.toLowerCase().includes(q));
    });
  }

  sum(list: InvoiceSummary[]): number { return list.reduce((t, i) => t + Number(i.total), 0); }

  get unpaid(): InvoiceSummary[] { return this.invoices.filter(i => i.status === 'SENT'); }
  get overdue(): InvoiceSummary[] { return this.invoices.filter(i => i.overdue); }
  get paidThisMonth(): InvoiceSummary[] {
    const now = new Date();
    return this.invoices.filter(i => {
      const d = parseLocal(i.issueDate);
      return i.status === 'PAID' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }

  count(f: Filter): number {
    switch (f) {
      case 'unpaid': return this.unpaid.length;
      case 'overdue': return this.overdue.length;
      case 'paid': return this.invoices.filter(i => i.status === 'PAID').length;
      case 'draft': return this.invoices.filter(i => i.status === 'DRAFT').length;
      default: return this.invoices.length;
    }
  }

  date(value: string | null): string {
    return value ? parseLocal(value).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  }

}
