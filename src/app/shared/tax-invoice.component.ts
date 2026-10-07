import { Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';
import { ApiService } from '../core/services/api.service';
import { TaxInvoice } from '../core/models';
import { errorMessage } from '../core/utils/errors';

/** The GST tax invoice for one subscription payment, printable or saveable as PDF. */
@Component({
  selector: 'app-tax-invoice',
  standalone: false,
  templateUrl: './tax-invoice.component.html',
  styleUrl: './tax-invoice.component.scss'
})
export class TaxInvoiceComponent implements OnChanges {
  @Input({ required: true }) paymentId!: number;
  /** Load through the admin API instead of the practice's own billing API. */
  @Input() admin = false;
  @ViewChild('paper') paper?: ElementRef<HTMLElement>;

  inv?: TaxInvoice;
  error = '';

  constructor(private api: ApiService) {}

  ngOnChanges(): void {
    this.inv = undefined;
    this.api.taxInvoice(this.paymentId, this.admin).subscribe({
      next: i => this.inv = i,
      error: err => this.error = errorMessage(err, 'Could not open this invoice.')
    });
  }

  rupees(paise: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(paise / 100);
  }

  date(value: string | null): string {
    return value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  }

  get half(): number { return (this.inv?.gstRate ?? 0) / 2; }

  /** Total in words, as Indian invoices usually show (lakh and crore). */
  get inWords(): string {
    if (!this.inv) return '';
    const rupees = Math.floor(this.inv.totalPaise / 100);
    const paise = this.inv.totalPaise % 100;
    return `Rupees ${words(rupees)}${paise ? ` and ${words(paise)} paise` : ''} only`;
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
}

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
  'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function belowHundred(n: number): string {
  return n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
}

function belowThousand(n: number): string {
  const h = Math.floor(n / 100), r = n % 100;
  return [h ? ONES[h] + ' Hundred' : '', r ? belowHundred(r) : ''].filter(Boolean).join(' ');
}

function words(n: number): string {
  if (n === 0) return 'Zero';
  const crore = Math.floor(n / 10000000), lakh = Math.floor(n / 100000) % 100;
  const thousand = Math.floor(n / 1000) % 100, rest = n % 1000;
  return [crore ? belowThousand(crore) + ' Crore' : '', lakh ? belowHundred(lakh) + ' Lakh' : '',
    thousand ? belowHundred(thousand) + ' Thousand' : '', rest ? belowThousand(rest) : ''].filter(Boolean).join(' ');
}
