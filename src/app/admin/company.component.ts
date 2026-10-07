import { Component, OnInit } from '@angular/core';
import { ToastService } from '../core/services/toast.service';
import { errorMessage } from '../core/utils/errors';
import { AdminApiService, Company } from './admin-api.service';

const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

@Component({
  selector: 'app-admin-company',
  standalone: false,
  styleUrls: ['./admin.scss'],
  template: `
    <div class="head">
      <div><h1>Company & GST</h1><p>Printed on every tax invoice and shown on the Contact, Privacy and Terms pages.</p></div>
    </div>

    @if (error) {
      <section class="panel"><app-empty-state icon="alert" title="Couldn't load company details" [text]="error" /></section>
    } @else if (!c) {
      <div class="skeleton" style="height: 420px"></div>
    } @else {
      <div class="cols">
        <section class="panel panel-pad">
          <h3>Business</h3>
          <p class="note">Use the exact name and address on your GST certificate. Razorpay checks they match your KYC.</p>
          <div class="field-row">
            <div class="field"><label for="c-name">Trade name (shown publicly)</label><input id="c-name" class="input" [(ngModel)]="c.businessName" maxlength="160"></div>
            <div class="field">
              <label for="c-legal">Legal name (proprietor)</label>
              <input id="c-legal" class="input" [(ngModel)]="c.legalName" maxlength="160">
              <span class="hint">For your records only. Never shown on the website or invoices.</span>
            </div>
          </div>
          <div class="field">
            <label for="c-addr">Registered address</label>
            <textarea id="c-addr" class="textarea" rows="3" [(ngModel)]="c.businessAddress" maxlength="400"></textarea>
            @if (!hasPin) { <span class="hint warn">Add the full address from page 1 of your GST certificate, with the PIN code. It's printed on every invoice.</span> }
          </div>
          <div class="field-row">
            <div class="field"><label for="c-phone">Phone / WhatsApp</label><input id="c-phone" class="input" [(ngModel)]="c.businessPhone" maxlength="30"></div>
            <div class="field"><label for="c-mail">Support email</label><input id="c-mail" class="input" type="email" [(ngModel)]="c.supportEmail" maxlength="160"></div>
          </div>
          <div class="field-row">
            <div class="field"><label for="c-city">Courts in (city)</label><input id="c-city" class="input" [(ngModel)]="c.jurisdictionCity" maxlength="80" placeholder="New Delhi"></div>
            <div class="field">
              <label for="c-griev">Grievance officer</label>
              <input id="c-griev" class="input" [(ngModel)]="c.grievanceOfficer" maxlength="120" placeholder="Leave empty to show only the designation">
              <span class="hint">Named on the Privacy page, as the e-commerce rules ask. The only place a person's name appears.</span>
            </div>
          </div>
        </section>

        <section class="panel panel-pad">
          <h3>GST</h3>
          <p class="note">Leave GSTIN empty and payments get plain receipts with no GST.</p>
          <div class="field">
            <label for="c-gst">GSTIN</label>
            <input id="c-gst" class="input mono-in" [(ngModel)]="c.gstin" maxlength="15" placeholder="09AAAAA0000A1Z5" (ngModelChange)="c.gstin = ($event || '').toUpperCase()">
            @if (gstinHint) { <span class="hint warn">{{ gstinHint }}</span> }
          </div>
          <div class="field-row">
            <div class="field">
              <label for="c-rate">GST rate (%)</label>
              <select id="c-rate" class="select" [(ngModel)]="c.gstRate">
                @for (r of [0, 5, 12, 18, 28]; track r) { <option [ngValue]="r">{{ r }}%</option> }
              </select>
            </div>
            <div class="field"><label for="c-sac">SAC code</label><input id="c-sac" class="input" [(ngModel)]="c.sac" maxlength="8" placeholder="998314"></div>
          </div>
          <div class="field">
            <span class="label">Plan prices</span>
            <div class="seg" [appSegMarker]="c.pricesIncludeTax">
              <span class="marker"></span>
              <button [class.on]="c.pricesIncludeTax" (click)="c.pricesIncludeTax = true">Include GST (₹799 = ₹799)</button>
              <button [class.on]="!c.pricesIncludeTax" (click)="c.pricesIncludeTax = false">GST on top (₹799 + GST)</button>
            </div>
          </div>
          <div class="field">
            <label for="c-prefix">Invoice number prefix</label>
            <input id="c-prefix" class="input small-in" [(ngModel)]="c.invoicePrefix" maxlength="8" (ngModelChange)="c.invoicePrefix = ($event || '').toUpperCase()">
            <span class="hint">Invoices look like {{ c.invoicePrefix || 'DS' }}/{{ fy }}/0001 and restart every April.</span>
          </div>
        </section>
      </div>

      <div class="savebar">
        @if (c.updatedAt) { <span class="muted small">Last saved {{ saved(c.updatedAt) }}</span> }
        <span class="spacer"></span>
        <button class="btn" (click)="load()">Undo changes</button>
        <button class="btn btn-primary" (click)="save()" [disabled]="saving" appRipple>Save company details</button>
      </div>
    }`,
  styles: [`
    .cols { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px; align-items: start; }
    @media (max-width: 1000px) { .cols { grid-template-columns: 1fr; } }
    h3 { font-size: 17px; }
    .note { font-size: 13px; color: var(--muted); margin: 4px 0 16px; }
    .mono-in { font-family: ui-monospace, monospace; letter-spacing: .04em; }
    .warn { color: var(--marigold-deep); }
    .small-in { width: 140px; }
    .seg { max-width: 100%; overflow-x: auto; }
    .savebar { display: flex; align-items: center; gap: 10px; margin-top: 16px; padding: 14px 18px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-lg); position: sticky; bottom: 12px; box-shadow: var(--shadow-2); }
    .small { font-size: 13px; }
  `]
})
export class AdminCompanyComponent implements OnInit {
  c?: Company;
  error = '';
  saving = false;

  constructor(private api: AdminApiService, private toast: ToastService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.api.company().subscribe({ next: c => { this.c = { ...c, gstin: c.gstin ?? '' }; this.error = ''; }, error: e => this.error = errorMessage(e) });
  }

  get gstinHint(): string {
    const g = (this.c?.gstin ?? '').trim();
    if (!g) return '';
    return GSTIN.test(g) ? '' : 'A GSTIN is 15 characters, like 09AAAAA0000A1Z5.';
  }

  get hasPin(): boolean { return /\b\d{6}\b/.test(this.c?.businessAddress ?? ''); }

  get fy(): string {
    const now = new Date();
    const y = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    return `${y}-${String((y + 1) % 100).padStart(2, '0')}`;
  }

  saved(v: string): string { return new Date(v).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }); }

  save(): void {
    if (!this.c) return;
    if (this.gstinHint) { this.toast.error(this.gstinHint); return; }
    this.saving = true;
    this.api.saveCompany({ ...this.c, gstin: (this.c.gstin ?? '').trim() || null }).subscribe({
      next: c => { this.saving = false; this.c = { ...c, gstin: c.gstin ?? '', updatedAt: new Date().toISOString() }; this.toast.success('Company details saved. New invoices use them straight away.'); },
      error: e => { this.saving = false; this.toast.error(errorMessage(e)); }
    });
  }
}
