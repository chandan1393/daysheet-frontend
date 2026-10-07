import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, ViewChild } from '@angular/core';
import { ApiService } from '../core/services/api.service';
import { ConfirmService } from '../core/services/confirm.service';
import { ToastService } from '../core/services/toast.service';
import { InvoiceDetail, InvoiceStatus } from '../core/models';
import { parseLocal } from '../core/utils/dates';
import { errorMessage } from '../core/utils/errors';

@Component({
  selector: 'app-invoice-view',
  standalone: false,
  templateUrl: './invoice-view.component.html',
  styleUrl: './invoice-view.component.scss'
})
export class InvoiceViewComponent implements OnChanges {
  @Input({ required: true }) invoiceId!: number;
  @Output() changed = new EventEmitter<void>();
  @Output() edit = new EventEmitter<InvoiceDetail>();
  @ViewChild('paper') paper?: ElementRef<HTMLElement>;

  invoice?: InvoiceDetail;
  error = '';
  busy = false;

  constructor(private api: ApiService, private toast: ToastService, private confirm: ConfirmService) {}

  ngOnChanges(): void {
    this.invoice = undefined;
    this.api.invoice(this.invoiceId).subscribe({
      next: inv => this.invoice = inv,
      error: err => this.error = errorMessage(err, 'Could not open this invoice.')
    });
  }

  date(value: string | null): string {
    return value ? parseLocal(value).toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  }

  setStatus(status: InvoiceStatus, message: string): void {
    if (!this.invoice) return;
    this.busy = true;
    this.api.setInvoiceStatus(this.invoice.id, status).subscribe({
      next: inv => { this.busy = false; this.invoice = inv; this.toast.success(message); this.changed.emit(); },
      error: err => { this.busy = false; this.toast.error(errorMessage(err)); }
    });
  }

  async markVoid(): Promise<void> {
    if (!this.invoice) return;
    const ok = await this.confirm.ask(`Void ${this.invoice.number}?`, 'It stays in your records but no longer counts as money owed.', 'Void invoice');
    if (ok) this.setStatus('VOID', `${this.invoice.number} voided.`);
  }

  async remove(): Promise<void> {
    if (!this.invoice) return;
    const inv = this.invoice;
    const ok = await this.confirm.ask(`Delete ${inv.number}?`, 'Drafts can be deleted permanently.', 'Delete draft');
    if (!ok) return;
    this.api.deleteInvoice(inv.id).subscribe({
      next: () => { this.toast.success(`${inv.number} deleted.`); this.invoice = undefined; this.error = 'This draft was deleted.'; this.changed.emit(); },
      error: err => this.toast.error(errorMessage(err))
    });
  }

  /** Prints only the invoice: clones it into a print root and hides the rest of the page. */
  print(): void {
    const el = this.paper?.nativeElement;
    if (!el) return;
    const root = document.createElement('div');
    root.id = 'print-root';
    root.appendChild(el.cloneNode(true));
    document.body.appendChild(root);
    document.body.classList.add('printing');
    const cleanup = () => {
      document.body.classList.remove('printing');
      root.remove();
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
    setTimeout(cleanup, 1000);
  }

  copySummary(): void {
    if (!this.invoice) return;
    const i = this.invoice;
    const fmt = new Intl.NumberFormat(undefined, { style: 'currency', currency: i.currency });
    const text = `Hi ${i.client.name.split(' ')[0]}, here is invoice ${i.number} from ${i.practice.name} for ${fmt.format(i.total)}`
      + (i.dueDate ? `, due ${this.date(i.dueDate)}` : '') + '.' + (i.notes ? `\n${i.notes}` : '');
    navigator.clipboard?.writeText(text).then(() => this.toast.success('Message copied. Paste it into WhatsApp or email.'));
  }
}
