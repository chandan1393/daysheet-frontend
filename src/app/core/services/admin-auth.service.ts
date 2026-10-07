import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminAccount {
  id: number;
  email: string;
  fullName: string;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AdminSession {
  token: string;
  admin: AdminAccount;
}

const KEY = 'daysheet.admin';

/** Admin sessions are kept apart from practice sessions; one browser can hold both. */
@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly session$ = new BehaviorSubject<AdminSession | null>(this.restore());

  constructor(private http: HttpClient, private router: Router) {}

  get token(): string | null { return this.session$.value?.token ?? null; }
  get admin(): AdminAccount | null { return this.session$.value?.admin ?? null; }
  get isLoggedIn(): boolean { return !!this.token; }

  login(email: string, password: string): Observable<AdminSession> {
    return this.http.post<AdminSession>(`${environment.apiUrl}/admin/auth/login`, { email, password })
      .pipe(tap(s => { sessionStorage.setItem(KEY, JSON.stringify(s)); this.session$.next(s); }));
  }

  logout(redirect = true): void {
    sessionStorage.removeItem(KEY);
    this.session$.next(null);
    if (redirect) this.router.navigate(['/admin/login']);
  }

  private restore(): AdminSession | null {
    try {
      const raw = sessionStorage.getItem(KEY);
      return raw ? JSON.parse(raw) as AdminSession : null;
    } catch {
      return null;
    }
  }
}
