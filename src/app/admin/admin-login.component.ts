import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AdminAuthService } from '../core/services/admin-auth.service';
import { errorMessage } from '../core/utils/errors';

@Component({
  selector: 'app-admin-login',
  standalone: false,
  styleUrls: ['../auth/auth.scss'],
  template: `
    <div class="side-form">
      <a class="brand" routerLink="/"><span class="mark" aria-hidden="true"><i></i><i></i><i></i></span>Daysheet</a>
      <div class="form-area">
        <h1>Admin sign in</h1>
        <p class="sub">For the Daysheet team only. Every action here is logged.</p>
        @if (error) { <div class="form-error" role="alert"><app-icon name="alert" [size]="18" />{{ error }}</div> }
        <form (ngSubmit)="submit()" novalidate>
          <div class="field">
            <label for="a-email">Email</label>
            <input id="a-email" class="input" type="email" name="email" [(ngModel)]="email" autocomplete="username" required>
          </div>
          <div class="field">
            <label for="a-pass">Password</label>
            <div class="pw">
              <input id="a-pass" class="input" [type]="show ? 'text' : 'password'" name="password" [(ngModel)]="password" autocomplete="current-password" required>
              <button type="button" class="pw-toggle" (click)="show = !show">{{ show ? 'Hide' : 'Show' }}</button>
            </div>
          </div>
          <button class="btn btn-ink btn-lg submit" type="submit" [disabled]="loading" appRipple>
            @if (loading) { <span class="spinner"></span> } Sign in
          </button>
        </form>
      </div>
    </div>
    <aside class="side-art" aria-hidden="true">
      <h2>Run Daysheet from one place.</h2>
      <p>Practices, payments, prices, GST invoices and your company details.</p>
    </aside>`
})
export class AdminLoginComponent {
  email = '';
  password = '';
  show = false;
  loading = false;
  error = '';

  constructor(private auth: AdminAuthService, private router: Router) {}

  submit(): void {
    this.error = '';
    if (!this.email.trim() || !this.password) { this.error = 'Enter your email and password.'; return; }
    this.loading = true;
    this.auth.login(this.email.trim(), this.password).subscribe({
      next: () => this.router.navigate(['/admin']),
      error: err => { this.loading = false; this.error = errorMessage(err); }
    });
  }
}
