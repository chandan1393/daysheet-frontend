import { Component, OnInit } from '@angular/core';
import { ToastService } from '../core/services/toast.service';
import { errorMessage } from '../core/utils/errors';
import { listStagger } from '../shared/animations';
import { AdminApiService, AdminPlan, PlanUpdate, rupees } from './admin-api.service';

@Component({
  selector: 'app-admin-prices',
  standalone: false,
  styleUrls: ['./admin.scss'],
  animations: [listStagger],
  template: `
    <div class="head">
      <div><h1>Prices</h1><p>Plans shown on the website and in the app, in rupees. Changes apply to new payments straight away.</p></div>
      <button class="btn btn-primary" (click)="openNew()" appRipple><app-icon name="plus" [size]="16" [stroke]="2.5" />New plan</button>
    </div>

    @if (error) {
      <section class="panel"><app-empty-state icon="alert" title="Couldn't load plans" [text]="error" /></section>
    } @else {
      <div class="plans" [@listStagger]="plans.length">
        @for (p of plans; track p.code) {
          <button class="plan" [class.best]="p.highlighted" [class.hidden]="!p.active" (click)="edit(p)">
            <span class="top"><span class="code">{{ p.code }}</span>
              @if (!p.active) { <span class="pill EXPIRED">Hidden</span> }
              @if (p.badge) { <span class="badge">{{ p.badge }}</span> }
            </span>
            <strong class="name">{{ p.name }}</strong>
            <span class="price">{{ rupees(p.amountPaise) }}<small>per {{ p.intervalLabel }}, {{ p.durationDays }} days</small></span>
            @if (p.description) { <span class="desc">{{ p.description }}</span> }
            <span class="edit"><app-icon name="edit" [size]="14" />Edit</span>
          </button>
        }
      </div>
    }

    <app-drawer [open]="drawerOpen" [title]="editingCode ? 'Edit ' + model.name : 'New plan'" subtitle="Prices are in rupees. Existing paid periods never change." (closed)="drawerOpen = false">
      @if (!editingCode) {
        <div class="field">
          <label for="pl-code">Plan code</label>
          <input id="pl-code" class="input" [(ngModel)]="newCode" maxlength="40" placeholder="QUARTERLY" (ngModelChange)="newCode = $event.toUpperCase()">
          <span class="hint">Letters, numbers and _. Can't be changed later.</span>
        </div>
      }
      <div class="field"><label for="pl-name">Name</label><input id="pl-name" class="input" [(ngModel)]="model.name" maxlength="80"></div>
      <div class="field"><label for="pl-desc">Short description</label><input id="pl-desc" class="input" [(ngModel)]="model.description" maxlength="300"></div>
      <div class="field-row">
        <div class="field"><label for="pl-amt">Price (₹)</label><input id="pl-amt" class="input" type="number" min="1" step="1" [(ngModel)]="model.amountRupees"></div>
        <div class="field"><label for="pl-days">Days of access</label><input id="pl-days" class="input" type="number" min="1" max="1830" [(ngModel)]="model.durationDays"></div>
      </div>
      <div class="field-row">
        <div class="field">
          <label for="pl-int">Shown as "per …"</label>
          <select id="pl-int" class="select" [(ngModel)]="model.intervalLabel">
            @for (i of ['month', 'quarter', 'half year', 'year']; track i) { <option [value]="i">{{ i }}</option> }
          </select>
        </div>
        <div class="field"><label for="pl-badge">Badge</label><input id="pl-badge" class="input" [(ngModel)]="model.badge" maxlength="40" placeholder="2 months free"></div>
      </div>
      <div class="field">
        <label for="pl-feat">Features, one per line</label>
        <textarea id="pl-feat" class="textarea" rows="5" [(ngModel)]="model.features" maxlength="2000"></textarea>
      </div>
      <div class="field"><label for="pl-order">Order on the page</label><input id="pl-order" class="input small-in" type="number" [(ngModel)]="model.sortOrder"></div>
      <div class="switches">
        <label class="switch"><input type="checkbox" [(ngModel)]="model.highlighted"><span class="track"></span><span>Highlight as the recommended plan</span></label>
        <label class="switch"><input type="checkbox" [(ngModel)]="model.active"><span class="track"></span><span>Show on the website and in the app</span></label>
      </div>
      @if (formError) { <p class="err">{{ formError }}</p> }
      <div class="form-actions">
        <button class="btn" (click)="drawerOpen = false">Cancel</button>
        <button class="btn btn-primary" (click)="save()" [disabled]="saving" appRipple>Save plan</button>
      </div>
    </app-drawer>`,
  styles: [`
    .plans { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
    .plan { text-align: left; border: 1px solid var(--line); background: var(--surface); border-radius: var(--r-lg); padding: 18px; cursor: pointer;
      display: flex; flex-direction: column; gap: 6px; transition: transform .25s var(--ease-out), box-shadow .25s; }
    .plan:hover { transform: translateY(-3px); box-shadow: var(--shadow-2); }
    .plan.best { border-color: var(--lagoon); box-shadow: 0 0 0 1px var(--lagoon) inset; }
    .plan.hidden { opacity: .6; }
    .top { display: flex; align-items: center; gap: 6px; }
    .code { font-family: ui-monospace, monospace; font-size: 12px; color: var(--muted); }
    .badge { background: var(--marigold); color: var(--ink); font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 99px; }
    .name { font-size: 18px; color: var(--ink); font-family: var(--font-display); }
    .price { font-family: var(--font-display); font-weight: 800; font-size: 28px; color: var(--ink); display: flex; flex-direction: column; }
    .price small { font-family: var(--font-ui); font-size: 12.5px; font-weight: 500; color: var(--muted); }
    .desc { font-size: 13.5px; color: var(--muted); }
    .edit { margin-top: 6px; display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--lagoon-deep); }
    .switches { display: flex; flex-direction: column; gap: 12px; margin: 6px 0 14px; }
    .small-in { width: 120px; }
  `]
})
export class AdminPricesComponent implements OnInit {
  plans: AdminPlan[] = [];
  error = '';
  drawerOpen = false;
  editingCode: string | null = null;
  newCode = '';
  model: PlanUpdate = this.blank();
  saving = false;
  formError = '';
  readonly rupees = rupees;

  constructor(private api: AdminApiService, private toast: ToastService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.api.plans().subscribe({ next: p => { this.plans = p; this.error = ''; }, error: e => this.error = errorMessage(e) });
  }

  openNew(): void {
    this.editingCode = null;
    this.newCode = '';
    this.model = this.blank();
    this.model.sortOrder = this.plans.length + 1;
    this.formError = '';
    this.drawerOpen = true;
  }

  edit(p: AdminPlan): void {
    this.editingCode = p.code;
    this.model = {
      name: p.name, description: p.description ?? '', amountRupees: p.amountPaise / 100, durationDays: p.durationDays,
      intervalLabel: p.intervalLabel, badge: p.badge ?? '', features: p.features ?? '', highlighted: p.highlighted,
      active: p.active, sortOrder: p.sortOrder
    };
    this.formError = '';
    this.drawerOpen = true;
  }

  save(): void {
    const code = this.editingCode ?? this.newCode.trim();
    if (!/^[A-Z0-9_]{2,40}$/.test(code)) { this.formError = 'Plan code: 2 to 40 letters, numbers or _.'; return; }
    if (!this.model.name.trim()) { this.formError = 'Give the plan a name.'; return; }
    if (!(Number(this.model.amountRupees) >= 1)) { this.formError = 'Enter a price of at least ₹1.'; return; }
    this.saving = true;
    this.api.savePlan(code, { ...this.model, amountRupees: Number(this.model.amountRupees), durationDays: Number(this.model.durationDays) }).subscribe({
      next: () => { this.saving = false; this.drawerOpen = false; this.toast.success('Plan saved. The website shows it straight away.'); this.load(); },
      error: e => { this.saving = false; this.formError = errorMessage(e); }
    });
  }

  private blank(): PlanUpdate {
    return { name: '', description: '', amountRupees: 799, durationDays: 30, intervalLabel: 'month', badge: '', features: '', highlighted: false, active: true, sortOrder: 1 };
  }
}
