import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { ApiService } from '../core/services/api.service';
import { AuthService } from '../core/services/auth.service';
import { ConfirmService } from '../core/services/confirm.service';
import { ToastService } from '../core/services/toast.service';
import { Prescription } from '../core/models';
import { parseLocal } from '../core/utils/dates';
import { errorMessage } from '../core/utils/errors';

/** A prescription on the practice's letterhead: print, save as PDF or send on WhatsApp. */
@Component({
  selector: 'app-prescription-view',
  standalone: false,
  templateUrl: './prescription-view.component.html',
  styleUrl: './prescription-view.component.scss'
})
export class PrescriptionViewComponent {
  @Input({ required: true }) prescription!: Prescription;
  @Output() edit = new EventEmitter<Prescription>();
  @Output() deleted = new EventEmitter<void>();
  @ViewChild('paper') paper?: ElementRef<HTMLElement>;

  constructor(public auth: AuthService, private api: ApiService, private toast: ToastService, private confirm: ConfirmService) {}

  get p(): Prescription { return this.prescription; }

  date(v: string | null): string {
    if (!v) return '';
    const d = v.length <= 10 ? parseLocal(v) : new Date(v);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  /** Plain-text version for WhatsApp. */
  get text(): string {
    const w = this.auth.workspace;
    const lines = [`*${w?.name ?? ''}*`, w?.practitionerTitle ?? '', `Prescription for ${this.p.clientName}, ${this.date(this.p.createdAt)}`, ''];
    if (this.p.diagnosis) lines.push(`Diagnosis: ${this.p.diagnosis}`, '');
    this.p.items.forEach((i, n) => {
      lines.push(`${n + 1}. ${i.medicine}` + [i.dose, i.frequency, i.timing, i.duration].filter(Boolean).map(x => ` | ${x}`).join(''));
      if (i.notes) lines.push(`   ${i.notes}`);
    });
    if (this.p.tests) lines.push('', `Tests: ${this.p.tests}`);
    if (this.p.advice) lines.push('', `Advice: ${this.p.advice}`);
    if (this.p.followUpDate) lines.push('', `Follow-up: ${this.date(this.p.followUpDate)}`);
    return lines.filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n').trim();
  }

  whatsapp(): void {
    window.open(`https://wa.me/?text=${encodeURIComponent(this.text)}`, '_blank', 'noopener');
  }

  copy(): void {
    navigator.clipboard?.writeText(this.text).then(() => this.toast.success('Copied. Paste it into WhatsApp or email.'));
  }

  print(): void {
    const el = this.paper?.nativeElement;
    if (!el) return;
    const root = document.createElement('div');
    root.id = 'print-root';
    root.appendChild(el.cloneNode(true));
    document.body.appendChild(root);
    document.body.classList.add('printing');
    const cleanup = () => { document.body.classList.remove('printing'); root.remove(); window.removeEventListener('afterprint', cleanup); };
    window.addEventListener('afterprint', cleanup);
    window.print();
    setTimeout(cleanup, 1000);
  }

  async remove(): Promise<void> {
    const ok = await this.confirm.ask('Delete this prescription?', 'It will be removed from the record permanently.', 'Delete');
    if (!ok) return;
    this.api.deletePrescription(this.p.id).subscribe({
      next: () => { this.toast.success('Prescription deleted.'); this.deleted.emit(); },
      error: err => this.toast.error(errorMessage(err))
    });
  }
}
