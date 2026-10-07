import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { AuthService } from '../core/services/auth.service';
import { ConfirmService } from '../core/services/confirm.service';
import { ToastService } from '../core/services/toast.service';
import { Appointment, ClientDetail, ClientDocument, ClientPackage, Note, PackageTemplate, Prescription } from '../core/models';
import { parseLocal, toDateStr } from '../core/utils/dates';
import { documentHint } from '../core/utils/documents';
import { errorMessage } from '../core/utils/errors';
import { fadeSlide, listStagger } from '../shared/animations';
import { PortalUiService } from './portal-ui.service';

/** One block on the history timeline: a visit with what was recorded, or general entries for a day. */
interface HistoryEntry {
  key: string;
  date: Date;
  appt: Appointment | null;
  visitNumber: number | null;
  notes: Note[];
  docs: ClientDocument[];
  rx: Prescription[];
}

const NOT_SEEN = ['CANCELLED', 'NO_SHOW'];

@Component({
  selector: 'app-client-detail',
  standalone: false,
  templateUrl: './client-detail.component.html',
  styleUrl: './client-detail.component.scss',
  animations: [listStagger, fadeSlide]
})
export class ClientDetailComponent implements OnInit, OnDestroy {
  @ViewChild('composer') composer?: ElementRef<HTMLTextAreaElement>;

  client?: ClientDetail;
  error = '';
  tab: 'history' | 'documents' | 'invoices' | 'cases' | 'deadlines' = 'history';
  templates: PackageTemplate[] = [];
  sellOpen = false;
  sell = { templateId: 0, createInvoice: true, markPaid: true };
  editOpen = false;

  // Composer: notes and files go to the chosen visit, or to the person in general
  draft = '';
  linkTo: number | null = null;
  savingNote = false;
  pending: { key: number; name: string; appointmentId: number | null }[] = [];

  query = '';
  history: HistoryEntry[] = [];
  upcoming: Appointment[] = [];
  visitOptions: { id: number; label: string }[] = [];

  private id = 0;
  private seq = 0;
  private subs: Subscription[] = [];

  constructor(private route: ActivatedRoute, private router: Router, private api: ApiService,
              public auth: AuthService, public ui: PortalUiService, private toast: ToastService,
              private confirm: ConfirmService) {}

  ngOnInit(): void {
    this.subs.push(
      this.route.paramMap.subscribe(p => {
        this.id = Number(p.get('id'));
        this.client = undefined;
        this.linkTo = null;
        this.load(true);
      }),
      this.ui.changed$.subscribe(() => this.load(false))
    );
  }

  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }

  load(resetLink: boolean): void {
    this.api.client(this.id).subscribe({
      next: c => {
        this.client = c;
        this.error = '';
        this.rebuild();
        if (resetLink) this.linkTo = this.visitOptions[0]?.id ?? null;
      },
      error: err => this.error = errorMessage(err, 'Could not load this profile.')
    });
  }

  /** Builds the visit-by-visit timeline, newest first, with visit numbers counted from the first visit. */
  rebuild(): void {
    const c = this.client;
    if (!c) return;
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const past = c.appointments.filter(a => parseLocal(a.startAt) <= endOfToday)
      .sort((a, b) => a.startAt.localeCompare(b.startAt));
    this.upcoming = c.appointments
      .filter(a => parseLocal(a.startAt) > endOfToday && !NOT_SEEN.includes(a.status))
      .sort((a, b) => a.startAt.localeCompare(b.startAt));

    let n = 0;
    const visits = new Map<number, HistoryEntry>();
    for (const a of past) {
      const seen = !NOT_SEEN.includes(a.status);
      visits.set(a.id, {
        key: `v${a.id}`, date: parseLocal(a.startAt), appt: a,
        visitNumber: seen ? ++n : null, notes: [], docs: [], rx: []
      });
    }

    const general = new Map<string, HistoryEntry>();
    const generalFor = (iso: string): HistoryEntry => {
      const d = new Date(iso);
      const k = toDateStr(d);
      let e = general.get(k);
      if (!e) {
        e = { key: `g${k}`, date: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59), appt: null, visitNumber: null, notes: [], docs: [], rx: [] };
        general.set(k, e);
      }
      return e;
    };

    for (const note of c.notes) {
      const v = note.appointmentId !== null ? visits.get(note.appointmentId) : undefined;
      (v ?? generalFor(note.createdAt)).notes.push(note);
    }
    for (const doc of c.documents) {
      const v = doc.appointmentId !== null ? visits.get(doc.appointmentId) : undefined;
      (v ?? generalFor(doc.createdAt)).docs.push(doc);
    }
    for (const rx of c.prescriptions) {
      const v = rx.appointmentId !== null ? visits.get(rx.appointmentId) : undefined;
      (v ?? generalFor(rx.createdAt)).rx.push(rx);
    }
    for (const e of [...visits.values(), ...general.values()]) {
      e.notes.sort((x, y) => x.createdAt.localeCompare(y.createdAt));
      e.docs.sort((x, y) => x.createdAt.localeCompare(y.createdAt));
    }

    let entries = [...visits.values(), ...general.values()].sort((x, y) => y.date.getTime() - x.date.getTime());

    const q = this.query.trim().toLowerCase();
    if (q) {
      entries = entries.map(e => {
        const serviceHit = (e.appt?.serviceName ?? '').toLowerCase().includes(q);
        return serviceHit ? e : {
          ...e,
          notes: e.notes.filter(x => x.body.toLowerCase().includes(q)),
          docs: e.docs.filter(x => x.fileName.toLowerCase().includes(q)),
          rx: e.rx.filter(x => [x.diagnosis, x.advice, ...x.items.map(i => i.medicine)].some(t => (t ?? '').toLowerCase().includes(q)))
        };
      }).filter(e => (e.appt?.serviceName ?? '').toLowerCase().includes(q) || e.notes.length || e.docs.length || e.rx.length);
    }
    this.history = entries;

    this.visitOptions = [...past].reverse()
      .filter(a => !NOT_SEEN.includes(a.status))
      .slice(0, 20)
      .map(a => ({ id: a.id, label: `${this.dayLabel(a.startAt)}: ${a.serviceName}` }));
  }

  get tags(): string[] { return this.client?.tags ? this.client.tags.split(',') : []; }
  get hint(): string { return documentHint(this.auth.workspace?.profession); }
  get seenVisits(): number { return this.history.filter(e => e.visitNumber !== null).length; }

  get whatsapp(): string {
    return `https://wa.me/${(this.client?.phone ?? '').replace(/\D/g, '')}`;
  }

  get age(): number | null {
    if (!this.client?.dateOfBirth) return null;
    const dob = parseLocal(this.client.dateOfBirth);
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    if (now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate())) age--;
    return age;
  }

  // ---- Notes
  addNote(): void {
    const body = this.draft.trim();
    if (!body || !this.client) return;
    this.savingNote = true;
    this.api.addNote(this.client.id, body, this.linkTo).subscribe({
      next: n => {
        this.savingNote = false;
        this.draft = '';
        this.client?.notes.unshift(n);
        this.rebuild();
        this.toast.success(this.linkTo ? 'Note saved to the visit.' : 'Note saved.');
      },
      error: err => { this.savingNote = false; this.toast.error(errorMessage(err)); }
    });
  }

  onNoteKey(e: KeyboardEvent): void {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') this.addNote();
  }

  async deleteNote(n: Note): Promise<void> {
    if (!this.client) return;
    const ok = await this.confirm.ask('Delete this note?', 'The note will be removed permanently.', 'Delete note');
    if (!ok) return;
    this.api.deleteNote(this.client.id, n.id).subscribe({
      next: () => {
        if (this.client) this.client.notes = this.client.notes.filter(x => x.id !== n.id);
        this.rebuild();
        this.toast.success('Note deleted.');
      },
      error: err => this.toast.error(errorMessage(err))
    });
  }

  /** "Add a note" on a visit card: point the composer at that visit and jump to it. */
  writeFor(entry: HistoryEntry): void {
    this.linkTo = entry.appt?.id ?? null;
    const el = this.composer?.nativeElement;
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => el?.focus(), 350);
  }

  // ---- Files
  upload(files: File[], appointmentId: number | null): void {
    if (!this.client) return;
    for (const file of files) {
      const key = ++this.seq;
      this.pending.push({ key, name: file.name, appointmentId });
      this.api.uploadDocument(this.client.id, file, appointmentId).subscribe({
        next: doc => {
          this.pending = this.pending.filter(p => p.key !== key);
          this.client?.documents.unshift(doc);
          this.rebuild();
          this.toast.success(`${doc.fileName} uploaded.`);
        },
        error: err => {
          this.pending = this.pending.filter(p => p.key !== key);
          this.toast.error(errorMessage(err, `Could not upload ${file.name}.`));
        }
      });
    }
  }

  pendingFor(appointmentId: number | null) {
    return this.pending.filter(p => p.appointmentId === appointmentId);
  }

  visitLabel(doc: ClientDocument): string {
    if (doc.appointmentId === null) return 'General';
    const a = this.client?.appointments.find(x => x.id === doc.appointmentId);
    return a ? `${this.dayLabel(a.startAt)}, ${a.serviceName}` : 'Visit';
  }

  // ---- Prescriptions
  medicinesOf(p: Prescription): string { return p.items.map(i => i.medicine).join(', ') || p.diagnosis || 'Advice only'; }

  writeRx(entry?: HistoryEntry): void {
    if (!this.client) return;
    this.ui.writePrescription({ clientId: this.client.id, clientName: this.client.fullName, appointmentId: entry?.appt?.id ?? null });
  }

  // ---- Packages
  get activePackages(): ClientPackage[] { return (this.client?.packages ?? []).filter(p => p.status === 'ACTIVE'); }
  get pastPackages(): ClientPackage[] { return (this.client?.packages ?? []).filter(p => p.status !== 'ACTIVE'); }

  openSell(): void {
    this.api.packageTemplates().subscribe(t => {
      this.templates = t;
      if (!t.length) { this.toast.info('Create a package first under Services.'); return; }
      this.sell = { templateId: t[0].id, createInvoice: true, markPaid: true };
      this.sellOpen = true;
    });
  }

  get sellTemplate(): PackageTemplate | undefined { return this.templates.find(t => t.id === Number(this.sell.templateId)); }

  confirmSell(): void {
    if (!this.client) return;
    this.api.sellPackage(this.client.id, { templateId: Number(this.sell.templateId), purchasedOn: null, createInvoice: this.sell.createInvoice, markPaid: this.sell.markPaid })
      .subscribe({
        next: p => { this.sellOpen = false; this.toast.success(`${p.name} added. Completed visits use it up automatically.`); this.load(false); },
        error: err => this.toast.error(errorMessage(err))
      });
  }

  adjust(p: ClientPackage, delta: number): void {
    this.api.adjustPackage(p.id, delta).subscribe({
      next: updated => { Object.assign(p, updated); },
      error: err => this.toast.error(errorMessage(err))
    });
  }

  // ---- Other actions
  newAppointment(): void {
    if (this.client) this.ui.newAppointment({ clientId: this.client.id, clientName: this.client.fullName });
  }

  newInvoice(): void {
    if (this.client) this.ui.openInvoiceForm({ clientId: this.client.id });
  }

  onEdited(): void {
    this.editOpen = false;
    this.load(false);
  }

  async archive(): Promise<void> {
    if (!this.client) return;
    const name = this.client.fullName;
    const ok = await this.confirm.ask(`Archive ${name}?`,
      'They will be hidden from your list. Their visits, notes, files and invoices stay in your records.', 'Archive');
    if (!ok) return;
    this.api.archiveClient(this.client.id).subscribe({
      next: () => { this.toast.success(`${name} archived.`); this.router.navigate(['/app/clients']); },
      error: err => this.toast.error(errorMessage(err))
    });
  }

  // ---- Formatting
  dayLabel(value: string): string {
    return parseLocal(value).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  }

  entryDate(e: HistoryEntry): string {
    return e.date.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  noteTime(n: Note): string {
    return new Date(n.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  fullDate(value: string): string { return this.dayLabel(value); }

  memberSince(): string {
    return this.client ? new Date(this.client.createdAt).toLocaleDateString([], { month: 'long', year: 'numeric' }) : '';
  }
}
