import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { AdminAuthService } from './services/admin-auth.service';
import { ToastService } from './services/toast.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService, private admin: AdminAuthService, private toast: ToastService, private router: Router) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const isAdmin = req.url.includes('/api/admin/');
    const token = isAdmin ? this.admin.token : this.auth.token;
    const isPublic = req.url.includes('/public/') || req.url.endsWith('/auth/login') || req.url.endsWith('/auth/register')
      || req.url.endsWith('/auth/forgot-password') || req.url.endsWith('/auth/reset-password')
      || req.url.endsWith('/auth/verify-email') || req.url.endsWith('/auth/verify-link') || req.url.endsWith('/auth/resend-verification');
    const request = token && !isPublic
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(request).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 && !isPublic) {
          if (isAdmin) this.admin.logout(); else this.auth.logout();
        }
        if (err.status === 403 && !isAdmin && String(err.error?.message ?? '').includes('suspended')) {
          this.toast.error(err.error.message);
          this.auth.logout();
        }
        if (err.status === 402 && !isAdmin) {
          this.toast.error(err.error?.message || 'Your plan has ended. Choose a plan to keep making changes.');
          this.auth.refresh();
          this.router.navigate(['/app/settings'], { queryParams: { tab: 'plan' } });
        }
        return throwError(() => err);
      })
    );
  }
}
