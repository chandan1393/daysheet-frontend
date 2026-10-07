import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { ToastService } from '../core/services/toast.service';
import { AuthService } from '../core/services/auth.service';
import { ClientDetail, ClientRequest } from '../core/models';
import { errorMessage } from '../core/utils/errors';

@Component({
  selector: 'app-client-form',
  standalone: false,
  template: `
    <form (ngSubmit)="save()" #f="ngForm">
      <div class="field">
        <label for="cname">Full name</label>
        <input id="cname" class="input" name="fullName" [(ngModel)]="model.fullName" required placeholder="e.g. Aarav Mehta">
      </div>
      <div class="field-row">
        <div class="field">
          <label for="cphone">Phone</label>
          <input id="cphone" class="input" name="phone" type="tel" [(ngModel)]="model.phone" placeholder="+91 98765 43210">
          <span class="hint">Used for calls and WhatsApp reminders</span>
        </div>
        <div class="field">
          <label for="cemail">Email</label>
          <input id="cemail" class="input" name="email" type="email" [(ngModel)]="model.email" placeholder="name@example.com">
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label for="cdob">Date of birth</label>
          <input id="cdob" class="input" name="dob" type="date" [(ngModel)]="model.dateOfBirth">
        </div>
        <div class="field">
          <label for="ctags">Tags</label>
          <input id="ctags" class="input" name="tags" [(ngModel)]="model.tags" placeholder="VIP, Insurance">
          <span class="hint">Separate with commas</span>
        </div>
      </div>
      @if (error) { <p class="err">{{ error }}</p> }
      <div class="actions">
        <button type="button" class="btn" (click)="cancelled.emit()">Cancel</button>
        <button type="submit" class="btn btn-primary" [disabled]="saving || !model.fullName.trim()" appRipple>
          @if (saving) { <span class="spinner"></span> }
          {{ client ? 'Save changes' : 'Add ' + ('client' | term: true) }}
        </button>
      </div>
    </form>`,
  styles: [`
    .err { color: var(--danger); font-size: 14px; margin-bottom: 10px; }
    .actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
  `]
})
export class ClientFormComponent implements OnInit {
  @Input() client: ClientDetail | null = null;
  @Output() saved = new EventEmitter<{ id: number; fullName: string }>();
  @Output() cancelled = new EventEmitter<void>();

  model: ClientRequest = { fullName: '', email: '', phone: '', dateOfBirth: null, tags: '' };
  saving = false;
  error = '';

  constructor(private api: ApiService, private toast: ToastService, private auth: AuthService) {}

  ngOnInit(): void {
    if (this.client) {
      this.model = {
        fullName: this.client.fullName,
        email: this.client.email ?? '',
        phone: this.client.phone ?? '',
        dateOfBirth: this.client.dateOfBirth,
        tags: this.client.tags ?? ''
      };
    }
  }

  save(): void {
    if (!this.model.fullName.trim()) return;
    this.saving = true;
    this.error = '';
    const body: ClientRequest = { ...this.model, dateOfBirth: this.model.dateOfBirth || null };
    const req: Observable<{ id: number; fullName: string }> = this.client
      ? this.api.updateClient(this.client.id, body)
      : this.api.createClient(body);
    req.subscribe({
      next: c => {
        this.saving = false;
        this.toast.success(this.client ? 'Changes saved.' : `${c.fullName} added to your ${this.auth.term('clients', true)}.`);
        this.saved.emit({ id: c.id, fullName: c.fullName });
      },
      error: err => { this.saving = false; this.error = errorMessage(err); }
    });
  }
}
