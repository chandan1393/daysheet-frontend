import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AdminAccount } from '../core/services/admin-auth.service';

export interface AdminPaymentRow {
  id: number;
  workspaceId: number;
  practiceName: string;
  planName: string;
  amountPaise: number;
  method: string;
  reference: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  paidAt: string | null;
}

export interface AuditRow { id: number; adminEmail: string; action: string; details: string | null; createdAt: string; }

export interface PracticeRow {
  id: number;
  name: string;
  slug: string;
  ownerName: string | null;
  ownerEmail: string | null;
  profession: string;
  status: 'TRIAL' | 'ACTIVE' | 'EXPIRED';
  accessEndsAt: string | null;
  daysLeft: number;
  suspended: boolean;
  clients: number;
  createdAt: string;
  emailVerified: boolean;
}

export interface PracticeDetail {
  practice: PracticeRow;
  phone: string | null;
  email: string | null;
  address: string | null;
  timezone: string;
  billingName: string | null;
  billingAddress: string | null;
  billingState: string | null;
  billingGstin: string | null;
  suspendedReason: string | null;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  appointments: number;
  storageBytes: number;
  payments: AdminPaymentRow[];
}

export interface Overview {
  practices: number;
  inTrial: number;
  activePaid: number;
  expired: number;
  suspended: number;
  signups7d: number;
  signups30d: number;
  revenueThisMonthPaise: number;
  revenueThisYearPaise: number;
  revenueAllTimePaise: number;
  recentPayments: AdminPaymentRow[];
  recentPractices: PracticeRow[];
  recentActivity: AuditRow[];
}

export interface AdminPlan {
  id: number;
  code: string;
  name: string;
  description: string | null;
  amountPaise: number;
  durationDays: number;
  intervalLabel: string;
  badge: string | null;
  features: string | null;
  highlighted: boolean;
  active: boolean;
  sortOrder: number;
}

export interface PlanUpdate {
  name: string;
  description: string;
  amountRupees: number;
  durationDays: number;
  intervalLabel: string;
  badge: string;
  features: string;
  highlighted: boolean;
  active: boolean;
  sortOrder: number;
}

export interface Company {
  businessName: string;
  businessAddress: string;
  businessPhone: string | null;
  legalName: string | null;
  supportEmail: string;
  gstin: string | null;
  gstRate: number;
  pricesIncludeTax: boolean;
  sac: string | null;
  invoicePrefix: string;
  jurisdictionCity: string | null;
  grievanceOfficer: string | null;
  updatedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly base = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  me(): Observable<AdminAccount> { return this.http.get<AdminAccount>(`${this.base}/auth/me`); }
  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.base}/auth/password`, { currentPassword, newPassword });
  }

  overview(): Observable<Overview> { return this.http.get<Overview>(`${this.base}/overview`); }

  practices(q: string, status: string): Observable<PracticeRow[]> {
    return this.http.get<PracticeRow[]>(`${this.base}/practices`, { params: { q, status } });
  }
  practice(id: number): Observable<PracticeDetail> { return this.http.get<PracticeDetail>(`${this.base}/practices/${id}`); }
  extend(id: number, days: number, note: string): Observable<PracticeDetail> {
    return this.http.post<PracticeDetail>(`${this.base}/practices/${id}/extend`, { days, note });
  }
  recordPayment(id: number, body: { planCode: string; amountRupees: number; reference: string; billingStateCode: string }): Observable<PracticeDetail> {
    return this.http.post<PracticeDetail>(`${this.base}/practices/${id}/payments`, body);
  }
  suspend(id: number, suspended: boolean, reason: string): Observable<PracticeDetail> {
    return this.http.post<PracticeDetail>(`${this.base}/practices/${id}/suspend`, { suspended, reason });
  }

  payments(from: string, to: string): Observable<AdminPaymentRow[]> {
    return this.http.get<AdminPaymentRow[]>(`${this.base}/payments`, { params: { from, to } });
  }
  gstReport(from: string, to: string): Observable<Blob> {
    return this.http.get(`${this.base}/gst-report`, { params: { from, to }, responseType: 'blob' });
  }

  plans(): Observable<AdminPlan[]> { return this.http.get<AdminPlan[]>(`${this.base}/plans`); }
  savePlan(code: string, body: PlanUpdate): Observable<AdminPlan> { return this.http.put<AdminPlan>(`${this.base}/plans/${code}`, body); }

  company(): Observable<Company> { return this.http.get<Company>(`${this.base}/company`); }
  saveCompany(body: Company): Observable<Company> { return this.http.put<Company>(`${this.base}/company`, body); }

  admins(): Observable<AdminAccount[]> { return this.http.get<AdminAccount[]>(`${this.base}/admins`); }
  createAdmin(body: { email: string; fullName: string; password: string }): Observable<AdminAccount> {
    return this.http.post<AdminAccount>(`${this.base}/admins`, body);
  }
  setAdminActive(id: number, active: boolean): Observable<AdminAccount> {
    return this.http.post<AdminAccount>(`${this.base}/admins/${id}/active`, { active });
  }
  activity(): Observable<AuditRow[]> { return this.http.get<AuditRow[]>(`${this.base}/activity`); }
}

export function rupees(paise: number, decimals = 0): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    .format(paise / 100);
}

export function shortDate(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}

/** Admin actions in plain words for the activity log. */
export const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Logged in', ADMIN_CREATED: 'Added admin', ADMIN_ACTIVATED: 'Re-activated admin', ADMIN_DEACTIVATED: 'Deactivated admin',
  PASSWORD_CHANGED: 'Changed password', ACCESS_EXTENDED: 'Extended access', PAYMENT_RECORDED: 'Recorded payment',
  PRACTICE_SUSPENDED: 'Suspended practice', PRACTICE_RESTORED: 'Restored practice', PLAN_SAVED: 'Saved plan', COMPANY_SAVED: 'Saved company details'
};
