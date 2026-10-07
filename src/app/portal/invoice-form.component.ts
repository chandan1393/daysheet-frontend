import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ApiService } from '../core/services/api.service';
import { ToastService } from '../core/services/toast.service';
import { ClientSummary, InvoiceDetail, InvoiceItem, InvoiceRequest, InvoiceStatus, ServiceOffering } from '../core/models';
import { addDays, toDateStr } from '../core/utils/dates';
import { errorMessage } from '../core/utils/errors';
import { fadeSlide } from '../shared/animations';

interface Line extends InvoiceItem { key: number; }

@Component({
  selector: 'app-invoice-form',
  standalone: false,
  templateUrl: './invoice-form.component.html',
  styleUrl: './invoice-form.component.scss',
  animations: [fadeSlide]
})
export class InvoiceFormComponent implements OnInit {
  @Input() invoice: InvoiceDetail | null = null;
  @Input() clientId: number | null = null;
  @Output() saved = new EventEmitter<InvoiceDetail>();
  @Output() cancelled = new EventEmitter<void>();

  clients: ClientSummary[] = [];
  services: ServiceOffering[] = [];

  client: number | null = null;
  issueDate = toDateStr(new Date());
  dueDate: string | null = toDateStr(addDays(new Date(), 7));
  taxRate = 0;
  notes = '';
  lines: Line[] = [];
  saving = false;
  error = '';

  private nextKey = 1;

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit(): void {
    const inv = this.invoice;
    if (inv) {
      this.client = inv.client.id;
      this.issueDate = inv.issueDate;
      this.dueDate = inv.dueDate;
      this.taxRate = Number(inv.taxRate);
      this.notes = inv.notes ?? '';
      this.lines = inv.items.map(i => ({ ...i, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice), key: this.nextKey++ }));
    } else {
      this.client = this.clientId;
      this.addLine();
    }
    this.api.clients().subscribe(list => this.clients = list);
    this.api.services().subscribe(list => this.services = list);
  }

  addLine(item: Partial<InvoiceItem> = {}): void {
    this.lines.push({ description: item.description ?? '', quantity: item.quantity ?? 1, unitPrice: item.unitPrice ?? 0, key: this.nextKey++ });
  }

  addService(id: string): void {
    const s = this.services.find(x => x.id === Number(id));
    if (!s) return;
    const empty = this.lines.find(l => !l.description.trim() && !Number(l.unitPrice));
    if (empty) {
      empty.description = s.name;
      empty.unitPrice = s.price;
    } else {
      this.addLine({ description: s.name, unitPrice: s.price });
    }
  }

  removeLine(l: Line): void {
    this.lines = this.lines.filter(x => x !== l);
    if (!this.lines.length) this.addLine();
  }

  lineTotal(l: Line): number { return (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0); }
  get subtotal(): number { return this.lines.reduce((t, l) => t + this.lineTotal(l), 0); }
  get tax(): number { return Math.round(this.subtotal * (Number(this.taxRate) || 0)) / 100; }
  get total(): number { return this.subtotal + this.tax; }

  save(status: InvoiceStatus): void {
    this.error = '';
    if (!this.client) { this.error = 'Choose who the invoice is for.'; return; }
    const items = this.lines.filter(l => l.description.trim())
      .map(l => ({ description: l.description.trim(), quantity: Number(l.quantity) || 0, unitPrice: Number(l.unitPrice) || 0 }));
    if (!items.length) { this.error = 'Add at least one line with a description.'; return; }

    const body: InvoiceRequest = {
      clientId: this.client,
      appointmentId: this.invoice?.appointmentId ?? null,
      issueDate: this.issueDate,
      dueDate: this.dueDate || null,
      taxRate: Number(this.taxRate) || 0,
      items,
      notes: this.notes,
      status
    };
    this.saving = true;
    const req = this.invoice ? this.api.updateInvoice(this.invoice.id, body) : this.api.createInvoice(body);
    req.subscribe({
      next: inv => {
        this.saving = false;
        this.toast.success(status === 'DRAFT' ? `${inv.number} saved as a draft.` : `${inv.number} is ready to send.`);
        this.saved.emit(inv);
      },
      error: err => { this.saving = false; this.error = errorMessage(err); }
    });
  }
}
