import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { ApiService } from '../core/services/api.service';
import { ToastService } from '../core/services/toast.service';
import { errorMessage } from '../core/utils/errors';

/** /forgot-password asks for an email; /reset-password?token=… sets a new password. */
@Component({
  selector: 'app-password-reset',
  standalone: false,
  templateUrl: './password-reset.component.html',
  styleUrls: ['./auth.scss']
})
export class PasswordResetComponent implements OnInit {
  readonly appName = environment.appName;
  mode: 'forgot' | 'reset' = 'forgot';
  token = '';
  email = '';
  password = '';
  confirm = '';
  showPassword = false;
  loading = false;
  error = '';
  sent = '';

  constructor(private route: ActivatedRoute, private router: Router, private api: ApiService, private toast: ToastService) {}

  ngOnInit(): void {
    this.mode = this.route.snapshot.data['mode'] === 'reset' ? 'reset' : 'forgot';
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (this.mode === 'reset' && !this.token) this.error = 'This link is incomplete. Ask for a new reset email.';
  }

  requestLink(): void {
    this.error = '';
    if (!/^\S+@\S+\.\S+$/.test(this.email.trim())) { this.error = 'Enter a valid email.'; return; }
    this.loading = true;
    this.api.forgotPassword(this.email.trim()).subscribe({
      next: r => { this.loading = false; this.sent = r.message; },
      error: err => { this.loading = false; this.error = errorMessage(err); }
    });
  }

  setPassword(): void {
    this.error = '';
    if (this.password.length < 8 || this.password.length > 72) { this.error = 'Use 8 to 72 characters for your password.'; return; }
    if (this.password !== this.confirm) { this.error = 'The two passwords are different.'; return; }
    this.loading = true;
    this.api.resetPassword(this.token, this.password).subscribe({
      next: r => { this.loading = false; this.toast.success(r.message); this.router.navigate(['/login']); },
      error: err => { this.loading = false; this.error = errorMessage(err); }
    });
  }
}
