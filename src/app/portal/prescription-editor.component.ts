import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ApiService } from '../core/services/api.service';
import { ToastService } from '../core/services/toast.service';
import { Prescription, RxItem } from '../core/models';
import { addDays, toDateStr } from '../core/utils/dates';
import { errorMessage } from '../core/utils/errors';
import { fadeSlide } from '../shared/animations';
import { PrescriptionRequestUi } from './portal-ui.service';

interface Line extends RxItem { key: number; }

@Component({
  selector: 'app-prescription-editor',
  standalone: false,
  templateUrl: './prescription-editor.component.html',
  styleUrl: './prescription-editor.component.scss',
  animations: [fadeSlide]
})
export class PrescriptionEditorComponent implements OnInit {
  @Input({ required: true }) request!: PrescriptionRequestUi;
  @Output() saved = new EventEmitter<Prescription>();
  @Output() cancelled = new EventEmitter<void>();

  vitals = '';
  complaints = '';
  diagnosis = '';
  advice = '';
  tests = '';
  followUpDate: string | null = null;
  lines: Line[] = [];
  suggestions: string[] = [];
  saving = false;
  error = '';

  readonly frequencies = ['1-0-1', '1-0-0', '0-0-1', '1-1-1', '0-1-0', '1-1-1-1', 'SOS', 'Once a week'];
  readonly timings = ['After food', 'Before food', 'Empty stomach', 'At bedtime', 'With milk'];
  readonly durations = ['3 days', '5 days', '7 days', '10 days', '2 weeks', '1 month', '3 months', 'Continue'];
  readonly followUps = [3, 5, 7, 15, 30];

  private nextKey = 1;
  private suggestTimer?: ReturnType<typeof setTimeout>;

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit(): void {
    const src = this.request.prescription ?? this.request.repeatFrom;
    if (src) {
      if (this.request.prescription) {
        this.vitals = src.vitals ?? '';
        this.complaints = src.complaints ?? '';
        this.followUpDate = src.followUpDate;
      }
      this.diagnosis = src.diagnosis ?? '';
      this.advice = src.advice ?? '';
      this.tests = src.tests ?? '';
      this.lines = src.items.map(i => ({ ...i, key: this.nextKey++ }));
    }
    if (!this.lines.length) this.addLine();
    this.loadSuggestions('');
  }

  addLine(): void {
    this.lines.push({ medicine: '', dose: '1 tablet', frequency: '1-0-1', timing: 'After food', duration: '5 days', notes: '', key: this.nextKey++ });
  }

  removeLine(l: Line): void {
    this.lines = this.lines.filter(x => x !== l);
    if (!this.lines.length) this.addLine();
  }

  move(l: Line, dir: -1 | 1): void {
    const i = this.lines.indexOf(l), j = i + dir;
    if (j < 0 || j >= this.lines.length) return;
    [this.lines[i], this.lines[j]] = [this.lines[j], this.lines[i]];
  }

  onMedicineInput(value: string): void {
    clearTimeout(this.suggestTimer);
    this.suggestTimer = setTimeout(() => this.loadSuggestions(value), 200);
  }

  private loadSuggestions(q: string): void {
    this.api.medicines(q).subscribe({ next: s => this.suggestions = s, error: () => {} });
  }

  setFollowUp(days: number): void {
    this.followUpDate = toDateStr(addDays(new Date(), days));
  }

  save(): void {
    this.error = '';
    const items = this.lines.filter(l => l.medicine.trim()).map(({ key, ...i }) => ({
      ...i, medicine: i.medicine.trim()
    }));
    if (!items.length && !this.diagnosis.trim() && !this.advice.trim()) {
      this.error = 'Add at least one medicine, a diagnosis or advice.';
      return;
    }
    this.saving = true;
    this.api.savePrescription({
      clientId: this.request.clientId,
      appointmentId: this.request.prescription?.appointmentId ?? this.request.appointmentId,
      vitals: this.vitals, complaints: this.complaints, diagnosis: this.diagnosis, advice: this.advice, tests: this.tests,
      followUpDate: this.followUpDate || null, items
    }, this.request.prescription?.id).subscribe({
      next: p => { this.saving = false; this.toast.success('Prescription saved.'); this.saved.emit(p); },
      error: err => { this.saving = false; this.error = errorMessage(err); }
    });
  }
}
