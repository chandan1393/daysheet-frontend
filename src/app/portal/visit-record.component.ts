import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { AuthService } from '../core/services/auth.service';
import { ConfirmService } from '../core/services/confirm.service';
import { ToastService } from '../core/services/toast.service';
import { Appointment, Note, Prescription, VisitRecord } from '../core/models';
import { addDays, parseLocal } from '../core/utils/dates';
import { documentHint } from '../core/utils/documents';
import { errorMessage } from '../core/utils/errors';
import { fadeSlide } from '../shared/animations';
import { PortalUiService } from './portal-ui.service';

/**
 * Shown inside an appointment: what happened last time, what is recorded for
 * this visit, and a one-tap follow-up booking.
 */
@Component({
  selector: 'app-visit-record',
  standalone: false,
  templateUrl: './visit-record.component.html',
  styleUrl: './visit-record.component.scss',
  animations: [fadeSlide]
})
export class VisitRecordComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) appointment!: Appointment;

  record?: VisitRecord;
  error = '';
  draft = '';
  saving = false;
  showPrevious = true;
  pending: { key: number; name: string }[] = [];

  readonly followUps = [
    { label: '1 week', days: 7 },
    { label: '15 days', days: 15 },
    { label: '1 month', days: 30 }
  ];

  private seq = 0;
  private sub?: Subscription;

  constructor(private api: ApiService, public auth: AuthService, public ui: PortalUiService,
              private toast: ToastService, private confirm: ConfirmService) {}

  ngOnInit(): void {
    // Reload when a file is deleted from the viewer or anything else changes.
    this.sub = this.ui.changed$.subscribe(() => this.load());
  }

  ngOnChanges(): void { this.load(); }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  get hint(): string { return documentHint(this.auth.workspace?.profession); }

  get rxEnabled(): boolean { return this.auth.hasModule('PRESCRIPTIONS'); }

  writeRx(repeatFrom?: Prescription): void {
    this.ui.writePrescription({
      clientId: this.appointment.clientId, clientName: this.appointment.clientName,
      appointmentId: this.appointment.id, repeatFrom
    });
  }

  medicinesOf(p: Prescription): string {
    return p.items.map(i => i.medicine).join(', ') || p.diagnosis || 'Advice only';
  }

  get ordinal(): string {
    const n = this.record?.visitNumber ?? 1;
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  load(): void {
    this.api.visitRecord(this.appointment.id).subscribe({
      next: r => { this.record = r; this.error = ''; },
      error: err => this.error = errorMessage(err, 'Could not load the visit record.')
    });
  }

  saveNote(): void {
    const body = this.draft.trim();
    if (!body || !this.record) return;
    this.saving = true;
    this.api.addNote(this.appointment.clientId, body, this.appointment.id).subscribe({
      next: n => {
        this.saving = false;
        this.draft = '';
        this.record?.notes.push(n);
        this.toast.success('Note saved to this visit.');
      },
      error: err => { this.saving = false; this.toast.error(errorMessage(err)); }
    });
  }

  onKey(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') this.saveNote();
  }

  upload(files: File[]): void {
    for (const file of files) {
      const key = ++this.seq;
      this.pending.push({ key, name: file.name });
      this.api.uploadDocument(this.appointment.clientId, file, this.appointment.id).subscribe({
        next: doc => {
          this.pending = this.pending.filter(p => p.key !== key);
          this.record?.documents.push(doc);
          this.toast.success(`${doc.fileName} added to this visit.`);
        },
        error: err => {
          this.pending = this.pending.filter(p => p.key !== key);
          this.toast.error(errorMessage(err, `Could not upload ${file.name}.`));
        }
      });
    }
  }

  async deleteNote(n: Note): Promise<void> {
    const ok = await this.confirm.ask('Delete this note?', 'It will be removed from the record permanently.', 'Delete note');
    if (!ok) return;
    this.api.deleteNote(this.appointment.clientId, n.id).subscribe({
      next: () => { if (this.record) this.record.notes = this.record.notes.filter(x => x.id !== n.id); },
      error: err => this.toast.error(errorMessage(err))
    });
  }

  bookFollowUp(days: number): void {
    const start = addDays(parseLocal(this.appointment.startAt), days);
    this.ui.newAppointment({
      start,
      clientId: this.appointment.clientId,
      clientName: this.appointment.clientName,
      serviceId: this.appointment.serviceId
    });
  }

  followUpDate(days: number): string {
    return addDays(parseLocal(this.appointment.startAt), days)
      .toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
  }

  date(value: string): string {
    return parseLocal(value).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }

  noteTime(n: Note): string {
    return new Date(n.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
}
