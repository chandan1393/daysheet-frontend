import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthService } from '../core/services/auth.service';
import { errorMessage } from '../core/utils/errors';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./auth.scss', './login.component.scss']
})
export class LoginComponent {
  readonly appName = environment.appName;
  loading = false;
  error = '';
  showPassword = false;

  private readonly fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  constructor(private auth: AuthService, private router: Router) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.error = '';
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigate(['/app']),
      error: err => {
        this.loading = false;
        const f = err?.error?.fields;
        if (err?.status === 403 && f?.reason === 'EMAIL_NOT_VERIFIED') {
          this.auth.setPending(f.email, f.pendingToken);
          this.router.navigate(['/verify-email']);
          return;
        }
        this.error = errorMessage(err, 'Could not log in. Try again.');
      }
    });
  }
}
