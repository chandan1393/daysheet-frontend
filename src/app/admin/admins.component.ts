import { Component, OnInit } from '@angular/core';
import { AdminAccount, AdminAuthService } from '../core/services/admin-auth.service';
import { ConfirmService } from '../core/services/confirm.service';
import { ToastService } from '../core/services/toast.service';
import { errorMessage } from '../core/utils/errors';
import { ACTION_LABELS, AdminApiService, AuditRow, shortDate } from './admin-api.service';

@Component({
  selector: 'app-admin-admins',
  standalone: false,
  styleUrls: ['./admin.scss'],
  template: `
    <div class="head">
      <div><h1>Admins & activity</h1><p>Who can sign in to this panel, and everything they've changed.</p></div>
      <button class="btn btn-primary" (click)="addOpen = true" appRipple><app-icon name="plus" [size]="16" [stroke]="2.5" />Add admin</button>
    </div>

    <div class="grid2">
      <section class="panel">
        <div class="panel-head"><h3>Admins</h3></div>
        <ul class="list">
          @for (a of admins; track a.id) {
            <li [class.off]="!a.active">
              <app-avatar [name]="a.fullName" [size]="34" />
              <span class="grow"><strong>{{ a.fullName }}@if (a.id === me?.id) { <span class="you">you</span> }</strong>
                <span class="sub">{{ a.email }}, last sign-in {{ a.lastLoginAt ? date(a.lastLoginAt) : 'never' }}</span></span>
              @if (a.id !== me?.id) {
                <button class="btn btn-sm" [class.btn-danger]="a.active" (click)="toggle(a)">{{ a.active ? 'Deactivate' : 'Re-activate' }}</button>
              }
            </li>
          }
        </ul>
      </section>

      <section class="panel panel-pad">
        <h3>Change your password</h3>
        <p class="note">At least 10 characters. Other admins aren't signed out.</p>
        <div class="field"><label for="pw-cur">Current password</label><input id="pw-cur" class="input" type="password" [(ngModel)]="pw.current" autocomplete="current-password"></div>
        <div class="field"><label for="pw-new">New password</label><input id="pw-new" class="input" type="password" [(ngModel)]="pw.next" autocomplete="new-password" maxlength="72"></div>
        <div class="field"><label for="pw-again">New password again</label><input id="pw-again" class="input" type="password" [(ngModel)]="pw.again" autocomplete="new-password" maxlength="72"></div>
        <div class="form-actions"><button class="btn btn-ink" (click)="changePassword()" [disabled]="savingPw">Change password</button></div>
      </section>
    </div>

    <section class="panel log">
      <div class="panel-head"><h3>Activity log</h3><span class="muted small">Last 100 actions</span></div>
      @if (!activity.length) { <p class="muted pad">Nothing yet.</p> }
      <ul class="list">
        @for (a of activity; track a.id) {
          <li>
            <span class="dot" [class]="a.action"></span>
            <span class="grow"><strong>{{ label(a.action) }}</strong>@if (a.details) { <span class="sub">{{ a.details }}</span> }</span>
            <span class="sub right">{{ a.adminEmail }}<br>{{ dateTime(a.createdAt) }}</span>
          </li>
        }
      </ul>
    </section>

    <app-drawer [open]="addOpen" title="Add an admin" subtitle="They can do everything you can, including adding more admins." (closed)="addOpen = false">
      <div class="field"><label for="na-name">Full name</label><input id="na-name" class="input" [(ngModel)]="add.fullName" maxlength="120"></div>
      <div class="field"><label for="na-mail">Email</label><input id="na-mail" class="input" type="email" [(ngModel)]="add.email" maxlength="160"></div>
      <div class="field">
        <label for="na-pass">Temporary password</label>
        <input id="na-pass" class="input" [(ngModel)]="add.password" maxlength="72">
        <span class="hint">At least 10 characters. Share it privately and ask them to change it after signing in.</span>
      </div>
      <div class="form-actions">
        <button class="btn" (click)="generate()">Generate password</button>
        <button class="btn btn-primary" (click)="create()" [disabled]="creating" appRipple>Add admin</button>
      </div>
    </app-drawer>`,
  styles: [`
    .grow { flex: 1; min-width: 0; strong { color: var(--ink); } }
    .you { font-size: 11px; font-weight: 700; color: var(--iris); background: var(--iris-wash); border-radius: 99px; padding: 1px 7px; margin-left: 6px; }
    .off { opacity: .55; }
    h3 { font-size: 17px; }
    .note { font-size: 13px; color: var(--muted); margin: 4px 0 14px; }
    .log { margin-top: 16px; }
    .pad { padding: 18px 20px; }
    .right { text-align: right; flex-shrink: 0; }
    .small { font-size: 13px; }
    .dot { width: 9px; height: 9px; border-radius: 50%; background: var(--line-strong); flex-shrink: 0; }
    .dot.PAYMENT_RECORDED, .dot.ACCESS_EXTENDED { background: var(--sage); }
    .dot.PLAN_SAVED, .dot.COMPANY_SAVED { background: var(--lagoon); }
    .dot.PRACTICE_SUSPENDED, .dot.ADMIN_DEACTIVATED { background: var(--rose); }
    .dot.ADMIN_CREATED, .dot.PASSWORD_CHANGED { background: var(--iris); }
  `]
})
export class AdminAdminsComponent implements OnInit {
  admins: AdminAccount[] = [];
  activity: AuditRow[] = [];
  addOpen = false;
  creating = false;
  savingPw = false;
  add = { fullName: '', email: '', password: '' };
  pw = { current: '', next: '', again: '' };
  readonly date = shortDate;

  constructor(private api: AdminApiService, private auth: AdminAuthService, private toast: ToastService, private confirm: ConfirmService) {}

  get me(): AdminAccount | null { return this.auth.admin; }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.api.admins().subscribe(a => this.admins = a);
    this.api.activity().subscribe(a => this.activity = a);
  }

  label(action: string): string { return ACTION_LABELS[action] ?? action; }

  dateTime(v: string): string {
    return new Date(v).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  generate(): void {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#%';
    const bytes = crypto.getRandomValues(new Uint8Array(14));
    this.add.password = Array.from(bytes, b => chars[b % chars.length]).join('');
  }

  create(): void {
    if (!this.add.fullName.trim() || !this.add.email.trim()) { this.toast.error('Enter a name and email.'); return; }
    if (this.add.password.length < 10) { this.toast.error('Use at least 10 characters for the password.'); return; }
    this.creating = true;
    this.api.createAdmin({ ...this.add, email: this.add.email.trim(), fullName: this.add.fullName.trim() }).subscribe({
      next: a => { this.creating = false; this.addOpen = false; this.add = { fullName: '', email: '', password: '' }; this.toast.success(`${a.fullName} can now sign in at /admin.`); this.load(); },
      error: e => { this.creating = false; this.toast.error(errorMessage(e)); }
    });
  }

  async toggle(a: AdminAccount): Promise<void> {
    const ok = await this.confirm.ask(a.active ? `Deactivate ${a.fullName}?` : `Re-activate ${a.fullName}?`,
      a.active ? 'They lose access to the admin panel immediately.' : 'They can sign in to the admin panel again.',
      a.active ? 'Deactivate' : 'Re-activate', a.active);
    if (!ok) return;
    this.api.setAdminActive(a.id, !a.active).subscribe({
      next: () => { this.toast.success('Done.'); this.load(); },
      error: e => this.toast.error(errorMessage(e))
    });
  }

  changePassword(): void {
    if (this.pw.next.length < 10) { this.toast.error('Use at least 10 characters.'); return; }
    if (this.pw.next !== this.pw.again) { this.toast.error('The two new passwords are different.'); return; }
    this.savingPw = true;
    this.api.changePassword(this.pw.current, this.pw.next).subscribe({
      next: () => { this.savingPw = false; this.pw = { current: '', next: '', again: '' }; this.toast.success('Password changed.'); this.load(); },
      error: e => { this.savingPw = false; this.toast.error(errorMessage(e)); }
    });
  }
}
