import { Component, OnInit } from '@angular/core';
import { ApiService } from '../core/services/api.service';
import { ConfirmService } from '../core/services/confirm.service';
import { ToastService } from '../core/services/toast.service';
import { ClientSummary, Deadline, DeadlineCategory, Recurrence } from '../core/models';
import { parseLocal, toDateStr } from '../core/utils/dates';
import { errorMessage } from '../core/utils/errors';
import { listStagger } from '../shared/animations';

interface Preset { title: string; category: DeadlineCategory; recurrence: Recurrence; due: () => Date; monthlyPeriod?: boolean; }

/** Next date on or after today with the given day of month. */
function nextDay(day: number): Date {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const d = new Date(t.getFullYear(), t.getMonth(), day);
  return d < t ? new Date(t.getFullYear(), t.getMonth() + 1, day) : d;
}

/** Next of several fixed dates in the year ([month index, day]). */
function nextOf(dates: [number, number][]): Date {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const all = [0, 1].flatMap(y => dates.map(([m, d]) => new Date(t.getFullYear() + y, m, d))).filter(d => d >= t);
  return all.sort((a, b) => a.getTime() - b.getTime())[0];
}

@Component({
  selector: 'app-deadlines',
  standalone: false,
  templateUrl: './deadlines.component.html',
  styleUrl: './deadlines.component.scss',
  animations: [listStagger]
})
export class DeadlinesComponent implements OnInit {
  all: Deadline[] = [];
  loading = true;
  error = '';
  view: 'overdue' | 'week' | 'upcoming' | 'done' = 'week';
  q = '';

  drawerOpen = false;
  editing: Deadline | null = null;
  bulk = false;
  clients: ClientSummary[] = [];
  clientFilter = '';
  selected = new Set<number>();
  form = this.blank();
  busy = false;

  /** Common Indian filings. Due dates are suggestions: always check the latest government notifications. */
  readonly presets: Preset[] = [
    { title: 'GSTR-1', category: 'GST', recurrence: 'MONTHLY', due: () => nextDay(11), monthlyPeriod: true },
    { title: 'GSTR-3B', category: 'GST', recurrence: 'MONTHLY', due: () => nextDay(20), monthlyPeriod: true },
    { title: 'TDS payment', category: 'TDS', recurrence: 'MONTHLY', due: () => nextDay(7), monthlyPeriod: true },
    { title: 'TDS return', category: 'TDS', recurrence: 'QUARTERLY', due: () => nextOf([[6, 31], [9, 31], [0, 31], [4, 31]]) },
    { title: 'Advance tax', category: 'ADVANCE_TAX', recurrence: 'QUARTERLY', due: () => nextOf([[5, 15], [8, 15], [11, 15], [2, 15]]) },
    { title: 'ITR filing', category: 'ITR', recurrence: 'YEARLY', due: () => nextOf([[6, 31]]) },
    { title: 'ROC annual filing', category: 'ROC', recurrence: 'YEARLY', due: () => nextOf([[9, 30]]) }
  ];
  readonly categories: { key: DeadlineCategory; label: string }[] = [
    { key: 'GST', label: 'GST' }, { key: 'TDS', label: 'TDS' }, { key: 'ITR', label: 'Income tax' }, { key: 'ADVANCE_TAX', label: 'Advance tax' },
    { key: 'ROC', label: 'ROC / MCA' }, { key: 'AUDIT', label: 'Audit' }, { key: 'OTHER', label: 'Other' }
  ];

  constructor(private api: ApiService, private toast: ToastService, private confirm: ConfirmService) {}

  ngOnInit(): void {
    this.load();
    this.api.clients().subscribe(c => this.clients = c);
  }

  load(): void {
    this.api.deadlines().subscribe({
      next: d => { this.all = d; this.loading = false; this.error = ''; if (!this.count('week') && this.count('overdue')) this.view = 'overdue'; },
      error: e => { this.loading = false; this.error = errorMessage(e); }
    });
  }

  private matches(d: Deadline, v: 'overdue' | 'week' | 'upcoming' | 'done'): boolean {
    if (v === 'done') return d.status === 'DONE';
    if (d.status === 'DONE') return false;
    const days = this.daysUntil(d.dueDate);
    return v === 'overdue' ? days < 0 : v === 'week' ? days >= 0 && days <= 7 : days > 7;
  }

  count(v: 'overdue' | 'week' | 'upcoming' | 'done'): number { return this.all.filter(d => this.matches(d, v)).length; }

  get visible(): Deadline[] {
    const q = this.q.trim().toLowerCase();
    const list = this.all.filter(d => this.matches(d, this.view))
      .filter(d => !q || d.title.toLowerCase().includes(q) || d.clientName.toLowerCase().includes(q) || (d.period ?? '').toLowerCase().includes(q));
    return this.view === 'done' ? list.sort((a, b) => (b.doneOn ?? '').localeCompare(a.doneOn ?? '')) : list;
  }

  toggleDone(d: Deadline): void {
    const done = d.status !== 'DONE';
    this.api.markDeadline(d.id, done).subscribe({
      next: next => {
        if (done && next.id !== d.id) this.toast.success(`Done. Next ${next.title} added for ${this.short(next.dueDate)}.`);
        else this.toast.success(done ? 'Marked as done.' : 'Moved back to pending.');
        this.load();
      },
      error: e => this.toast.error(errorMessage(e))
    });
  }

  // ---- Drawer
  openNew(bulk: boolean): void {
    this.editing = null;
    this.bulk = bulk;
    this.form = this.blank();
    this.selected = new Set();
    this.clientFilter = '';
    this.drawerOpen = true;
  }

  edit(d: Deadline): void {
    this.editing = d;
    this.bulk = false;
    this.form = { clientId: d.clientId, title: d.title, category: d.category, period: d.period ?? '', dueDate: d.dueDate, recurrence: d.recurrence, notes: d.notes ?? '' };
    this.drawerOpen = true;
  }

  applyPreset(p: Preset): void {
    const due = p.due();
    this.form.title = p.title;
    this.form.category = p.category;
    this.form.recurrence = p.recurrence;
    this.form.dueDate = toDateStr(due);
    this.form.period = p.monthlyPeriod
      ? new Date(due.getFullYear(), due.getMonth() - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
      : '';
  }

  get filteredClients(): ClientSummary[] {
    const q = this.clientFilter.trim().toLowerCase();
    return q ? this.clients.filter(c => c.fullName.toLowerCase().includes(q) || (c.tags ?? '').toLowerCase().includes(q)) : this.clients;
  }

  toggleClient(id: number): void { this.selected.has(id) ? this.selected.delete(id) : this.selected.add(id); }
  selectAllShown(): void { this.filteredClients.forEach(c => this.selected.add(c.id)); }

  save(): void {
    if (!this.form.title.trim() || !this.form.dueDate) { this.toast.error('Give it a name and a due date.'); return; }
    this.busy = true;
    if (this.bulk) {
      if (!this.selected.size) { this.busy = false; this.toast.error('Choose at least one client.'); return; }
      const { clientId, notes, ...rest } = this.form;
      this.api.bulkDeadlines({ ...rest, clientIds: [...this.selected] }).subscribe({
        next: r => { this.busy = false; this.drawerOpen = false; this.toast.success(`Added ${r.length} deadlines.`); this.load(); },
        error: e => { this.busy = false; this.toast.error(errorMessage(e)); }
      });
    } else {
      if (!this.form.clientId) { this.busy = false; this.toast.error('Choose the client.'); return; }
      this.api.saveDeadline({ ...this.form, clientId: Number(this.form.clientId) }, this.editing?.id).subscribe({
        next: () => { this.busy = false; this.drawerOpen = false; this.toast.success('Deadline saved.'); this.load(); },
        error: e => { this.busy = false; this.toast.error(errorMessage(e)); }
      });
    }
  }

  async remove(): Promise<void> {
    if (!this.editing) return;
    const ok = await this.confirm.ask('Delete this deadline?', `${this.editing.title} for ${this.editing.clientName}.`, 'Delete');
    if (!ok) return;
    this.api.deleteDeadline(this.editing.id).subscribe({ next: () => { this.drawerOpen = false; this.load(); }, error: e => this.toast.error(errorMessage(e)) });
  }

  // ---- Formatting
  daysUntil(v: string): number { return Math.round((parseLocal(v).getTime() - new Date(new Date().toDateString()).getTime()) / 864e5); }
  short(v: string): string { return parseLocal(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); }
  dueLabel(d: Deadline): string {
    if (d.status === 'DONE') return d.doneOn ? `Done ${this.short(d.doneOn)}` : 'Done';
    const n = this.daysUntil(d.dueDate);
    return n === 0 ? 'Due today' : n === 1 ? 'Due tomorrow' : n < 0 ? `${-n} day${n === -1 ? '' : 's'} late` : `In ${n} days`;
  }
  catLabel(c: string): string { return this.categories.find(x => x.key === c)?.label ?? c; }
  recurLabel(r: string): string { return r === 'MONTHLY' ? 'Every month' : r === 'QUARTERLY' ? 'Every quarter' : r === 'YEARLY' ? 'Every year' : ''; }

  private blank() {
    return { clientId: 0, title: '', category: 'GST' as string, period: '', dueDate: '', recurrence: 'MONTHLY' as string, notes: '' };
  }
}
