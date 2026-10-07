import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { ConfirmService } from '../core/services/confirm.service';
import { ToastService } from '../core/services/toast.service';
import { ClientSummary, Hearing, LegalCase } from '../core/models';
import { parseLocal, toDateStr } from '../core/utils/dates';
import { errorMessage } from '../core/utils/errors';
import { fadeSlide, listStagger } from '../shared/animations';

@Component({
  selector: 'app-cases',
  standalone: false,
  templateUrl: './cases.component.html',
  styleUrl: './cases.component.scss',
  animations: [listStagger, fadeSlide]
})
export class CasesComponent implements OnInit, OnDestroy {
  cases: LegalCase[] = [];
  loading = true;
  error = '';
  status: 'OPEN' | 'CLOSED' | 'ALL' = 'OPEN';
  q = '';

  // Drawer
  open?: LegalCase;
  drawer: 'none' | 'view' | 'form' = 'none';
  form = this.blankForm();
  clients: ClientSummary[] = [];
  hearingForm = { hearingDate: '', purpose: '' };
  outcomeFor: number | null = null;
  outcome = { text: '', nextDate: '', nextPurpose: '' };
  busy = false;

  private debounce?: ReturnType<typeof setTimeout>;
  private sub?: Subscription;

  constructor(private api: ApiService, private route: ActivatedRoute, private router: Router,
              private toast: ToastService, private confirm: ConfirmService) {}

  ngOnInit(): void {
    this.load();
    this.api.clients().subscribe(c => this.clients = c);
    this.sub = this.route.queryParamMap.subscribe(p => {
      const openId = Number(p.get('open'));
      const newFor = Number(p.get('new'));
      if (openId) this.view(openId);
      else if (newFor) this.startNew(newFor);
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); clearTimeout(this.debounce); }

  load(): void {
    this.api.cases(this.status, this.q.trim()).subscribe({
      next: c => { this.cases = c; this.loading = false; this.error = ''; },
      error: e => { this.loading = false; this.error = errorMessage(e); }
    });
  }

  onSearch(): void { clearTimeout(this.debounce); this.debounce = setTimeout(() => this.load(), 250); }
  setStatus(s: 'OPEN' | 'CLOSED' | 'ALL'): void { this.status = s; this.load(); }

  /** Hearings in the next 14 days across open cases. */
  get upcoming(): { c: LegalCase; date: string }[] {
    const today = toDateStr(new Date());
    const limit = toDateStr(new Date(Date.now() + 14 * 864e5));
    return this.cases.filter(c => c.status === 'OPEN' && c.nextHearing && c.nextHearing >= today && c.nextHearing <= limit)
      .map(c => ({ c, date: c.nextHearing! })).sort((a, b) => a.date.localeCompare(b.date));
  }

  // ---- Drawer
  view(id: number): void {
    this.drawer = 'view';
    this.open = undefined;
    this.outcomeFor = null;
    this.api.legalCase(id).subscribe({ next: c => this.show(c), error: e => this.toast.error(errorMessage(e)) });
  }

  private show(c: LegalCase): void {
    this.open = c;
    this.hearingForm = { hearingDate: '', purpose: '' };
  }

  closeDrawer(): void {
    this.drawer = 'none';
    this.router.navigate([], { queryParams: {}, replaceUrl: true });
  }

  startNew(clientId?: number): void {
    this.open = undefined;
    this.form = this.blankForm();
    if (clientId) this.form.clientId = clientId;
    this.drawer = 'form';
  }

  startEdit(): void {
    if (!this.open) return;
    const c = this.open;
    this.form = { clientId: c.clientId, title: c.title, caseNumber: c.caseNumber ?? '', court: c.court ?? '', oppositeParty: c.oppositeParty ?? '',
      caseType: c.caseType ?? '', status: c.status, notes: c.notes ?? '', firstHearing: '' };
    this.drawer = 'form';
  }

  saveCase(): void {
    if (!this.form.clientId || !this.form.title.trim()) { this.toast.error('Choose the client and give the case a title.'); return; }
    this.busy = true;
    const { firstHearing, ...body } = this.form;
    this.api.saveCase({ ...body, clientId: Number(body.clientId) }, this.open?.id).subscribe({
      next: c => {
        if (firstHearing && !this.open) {
          this.api.addHearing(c.id, { hearingDate: firstHearing, purpose: 'First hearing', outcome: '' }).subscribe(withHearing => this.afterSave(withHearing));
        } else {
          this.afterSave(c);
        }
      },
      error: e => { this.busy = false; this.toast.error(errorMessage(e)); }
    });
  }

  private afterSave(c: LegalCase): void {
    this.busy = false;
    this.toast.success('Case saved.');
    this.show(c);
    this.drawer = 'view';
    this.load();
  }

  addHearing(): void {
    if (!this.open || !this.hearingForm.hearingDate) { this.toast.error('Pick the hearing date.'); return; }
    this.api.addHearing(this.open.id, { ...this.hearingForm, outcome: '' }).subscribe({
      next: c => { this.show(c); this.toast.success('Hearing added.'); this.load(); },
      error: e => this.toast.error(errorMessage(e))
    });
  }

  startOutcome(h: Hearing): void {
    this.outcomeFor = h.id;
    this.outcome = { text: h.outcome ?? '', nextDate: '', nextPurpose: '' };
  }

  /** The everyday step after court: what happened, and the next date. */
  saveOutcome(h: Hearing): void {
    if (!this.open) return;
    const caseId = this.open.id;
    this.api.updateHearing(h.id, { hearingDate: h.hearingDate, purpose: h.purpose ?? '', outcome: this.outcome.text }).subscribe({
      next: c => {
        if (this.outcome.nextDate) {
          this.api.addHearing(caseId, { hearingDate: this.outcome.nextDate, purpose: this.outcome.nextPurpose, outcome: '' }).subscribe(next => {
            this.show(next); this.outcomeFor = null; this.toast.success('Saved, and the next hearing is in your list.'); this.load();
          });
        } else {
          this.show(c); this.outcomeFor = null; this.toast.success('Outcome saved.'); this.load();
        }
      },
      error: e => this.toast.error(errorMessage(e))
    });
  }

  async deleteHearing(h: Hearing): Promise<void> {
    const ok = await this.confirm.ask('Delete this hearing?', `${this.long(h.hearingDate)} will be removed from the case.`, 'Delete');
    if (!ok) return;
    this.api.deleteHearing(h.id).subscribe({ next: c => { this.show(c); this.load(); }, error: e => this.toast.error(errorMessage(e)) });
  }

  async deleteCase(): Promise<void> {
    if (!this.open) return;
    const ok = await this.confirm.ask(`Delete ${this.open.title}?`, 'The case and all its hearings will be removed permanently.', 'Delete case');
    if (!ok) return;
    this.api.deleteCase(this.open.id).subscribe({ next: () => { this.closeDrawer(); this.toast.success('Case deleted.'); this.load(); }, error: e => this.toast.error(errorMessage(e)) });
  }

  // ---- Formatting
  long(v: string | null): string {
    return v ? parseLocal(v).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  }
  dayNum(v: string): number { return parseLocal(v).getDate(); }
  monthShort(v: string): string { return parseLocal(v).toLocaleDateString('en-IN', { month: 'short' }); }
  weekday(v: string): string { return parseLocal(v).toLocaleDateString('en-IN', { weekday: 'short' }); }
  daysUntil(v: string): number { return Math.round((parseLocal(v).getTime() - new Date(new Date().toDateString()).getTime()) / 864e5); }
  whenLabel(v: string): string {
    const d = this.daysUntil(v);
    return d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : d < 0 ? `${-d} days ago` : `In ${d} days`;
  }
  isPast(h: Hearing): boolean { return this.daysUntil(h.hearingDate) < 0; }

  private blankForm() {
    return { clientId: 0, title: '', caseNumber: '', court: '', oppositeParty: '', caseType: '', status: 'OPEN', notes: '', firstHearing: '' };
  }
}
