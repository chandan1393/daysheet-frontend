import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RegisterRequest, RegisterResponse, Session, User, Workspace } from '../models';

const STORAGE_KEY = 'daysheet.session';
const PENDING_KEY = 'daysheet.pendingVerification';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly session$ = new BehaviorSubject<Session | null>(this.restore());

  readonly changes$ = this.session$.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  get token(): string | null { return this.session$.value?.token ?? null; }
  get user(): User | null { return this.session$.value?.user ?? null; }
  get workspace(): Workspace | null { return this.session$.value?.workspace ?? null; }
  get isLoggedIn(): boolean { return !!this.token; }

  login(email: string, password: string): Observable<Session> {
    return this.http.post<Session>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap(s => this.store(s)));
  }

  /** Creates the account and sends a verification email. No session until the email is confirmed. */
  register(body: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${environment.apiUrl}/auth/register`, body)
      .pipe(tap(r => this.setPending(r.email, r.pendingToken)));
  }

  verifyEmail(code: string): Observable<Session> {
    return this.http.post<Session>(`${environment.apiUrl}/auth/verify-email`, { pendingToken: this.pending?.pendingToken ?? '', code })
      .pipe(tap(s => { this.clearPending(); this.store(s); }));
  }

  verifyLink(token: string): Observable<Session> {
    return this.http.post<Session>(`${environment.apiUrl}/auth/verify-link`, { token })
      .pipe(tap(s => { this.clearPending(); this.store(s); }));
  }

  resendVerification(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/resend-verification`, { pendingToken: this.pending?.pendingToken ?? '' });
  }

  /** Who is waiting to verify (kept for this browser tab only). */
  get pending(): { email: string; pendingToken: string } | null {
    try {
      const raw = sessionStorage.getItem(PENDING_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  setPending(email: string, pendingToken: string): void {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ email, pendingToken }));
  }

  clearPending(): void { sessionStorage.removeItem(PENDING_KEY); }

  /** Re-reads user and workspace, e.g. after a reload, to pick up trial days left. */
  refresh(): void {
    if (!this.token) return;
    this.http.get<{ user: User; workspace: Workspace }>(`${environment.apiUrl}/auth/me`)
      .subscribe(me => this.store({ token: this.token!, ...me }));
  }

  setWorkspace(workspace: Workspace): void {
    const s = this.session$.value;
    if (s) this.store({ ...s, workspace });
  }

  logout(redirect = true): void {
    localStorage.removeItem(STORAGE_KEY);
    this.session$.next(null);
    if (redirect) this.router.navigate(['/login']);
  }

  hasModule(m: 'PRESCRIPTIONS' | 'PACKAGES' | 'CASES' | 'DEADLINES'): boolean {
    return this.workspace?.modules?.includes(m) ?? false;
  }

  /** Words this practice uses: 'client' → "Patient", 'clients' → "Patients", 'session' → "Consultation". */
  term(key: 'client' | 'clients' | 'session' | 'sessions', lower = false): string {
    const w = this.workspace;
    const session = w?.sessionLabel ?? 'Appointment';
    const value = key === 'client' ? w?.clientLabel ?? 'Client'
      : key === 'clients' ? w?.clientLabelPlural ?? 'Clients'
      : key === 'session' ? session
      : /(s|sh|ch|x)$/i.test(session) ? `${session}es` : `${session}s`;
    return lower ? value.toLowerCase() : value;
  }

  private store(s: Session): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    this.session$.next(s);
  }

  private restore(): Session | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) as Session : null;
    } catch {
      return null;
    }
  }
}
