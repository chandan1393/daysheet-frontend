import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Appointment, AppointmentRequest, BillingDetails, ClientPackage, Deadline, Hearing, LegalCase, PackModule, PackageTemplate, Prescription, PrescriptionRequest, BusinessInfo, Checkout, GstState, TaxInvoice, ClientDocument, PaymentRecord, PricePlan, VisitRecord, AppointmentStatus, BookingConfirmation, BookingRequest, ClientDetail,
  ClientRequest, ClientSummary, Dashboard, InvoiceDetail, InvoiceRequest, InvoiceStatus, InvoiceSummary,
  Note, Profession, PublicPractice, ServiceOffering, ServiceRequest, WorkingHours, Workspace, WorkspaceUpdate
} from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Public
  professions(): Observable<Profession[]> {
    return this.http.get<Profession[]>(`${this.base}/public/professions`);
  }
  practice(slug: string): Observable<PublicPractice> {
    return this.http.get<PublicPractice>(`${this.base}/public/book/${slug}`);
  }
  slots(slug: string, serviceId: number, date: string): Observable<{ date: string; slots: string[] }> {
    const params = new HttpParams().set('serviceId', serviceId).set('date', date);
    return this.http.get<{ date: string; slots: string[] }>(`${this.base}/public/book/${slug}/slots`, { params });
  }
  book(slug: string, body: BookingRequest): Observable<BookingConfirmation> {
    return this.http.post<BookingConfirmation>(`${this.base}/public/book/${slug}`, body);
  }

  plans(): Observable<PricePlan[]> {
    return this.http.get<PricePlan[]>(`${this.base}/public/plans`);
  }
  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/auth/forgot-password`, { email });
  }
  resetPassword(token: string, password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/auth/reset-password`, { token, password });
  }

  // Billing (Razorpay)
  createOrder(planCode: string): Observable<Checkout> {
    return this.http.post<Checkout>(`${this.base}/billing/orders`, { planCode });
  }
  verifyPayment(body: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }): Observable<Workspace> {
    return this.http.post<Workspace>(`${this.base}/billing/verify`, body);
  }
  payments(): Observable<PaymentRecord[]> {
    return this.http.get<PaymentRecord[]>(`${this.base}/billing/payments`);
  }
  taxInvoice(paymentId: number, admin = false): Observable<TaxInvoice> {
    return this.http.get<TaxInvoice>(admin
      ? `${this.base}/admin/payments/${paymentId}/invoice`
      : `${this.base}/billing/payments/${paymentId}/invoice`);
  }
  billingDetails(): Observable<BillingDetails> {
    return this.http.get<BillingDetails>(`${this.base}/billing/details`);
  }
  saveBillingDetails(body: BillingDetails): Observable<BillingDetails> {
    return this.http.put<BillingDetails>(`${this.base}/billing/details`, body);
  }
  gstStates(): Observable<GstState[]> {
    return this.http.get<GstState[]>(`${this.base}/public/gst-states`);
  }
  business(): Observable<BusinessInfo> {
    return this.http.get<BusinessInfo>(`${this.base}/public/business`);
  }

  // Dashboard
  dashboard(): Observable<Dashboard> {
    return this.http.get<Dashboard>(`${this.base}/dashboard`);
  }

  // Workspace
  updateWorkspace(body: WorkspaceUpdate): Observable<Workspace> {
    return this.http.put<Workspace>(`${this.base}/workspace`, body);
  }
  updateModules(modules: PackModule[]): Observable<Workspace> {
    return this.http.put<Workspace>(`${this.base}/workspace/modules`, { modules });
  }

  // Prescriptions
  prescription(id: number): Observable<Prescription> { return this.http.get<Prescription>(`${this.base}/prescriptions/${id}`); }
  medicines(q: string): Observable<string[]> { return this.http.get<string[]>(`${this.base}/prescriptions/medicines`, { params: { q } }); }
  savePrescription(body: PrescriptionRequest, id?: number): Observable<Prescription> {
    return id ? this.http.put<Prescription>(`${this.base}/prescriptions/${id}`, body)
      : this.http.post<Prescription>(`${this.base}/prescriptions`, body);
  }
  deletePrescription(id: number): Observable<void> { return this.http.delete<void>(`${this.base}/prescriptions/${id}`); }

  // Packages
  packageTemplates(): Observable<PackageTemplate[]> { return this.http.get<PackageTemplate[]>(`${this.base}/packages/templates`); }
  savePackageTemplate(body: Omit<PackageTemplate, 'id' | 'serviceName'>, id?: number): Observable<PackageTemplate> {
    return id ? this.http.put<PackageTemplate>(`${this.base}/packages/templates/${id}`, body)
      : this.http.post<PackageTemplate>(`${this.base}/packages/templates`, body);
  }
  deletePackageTemplate(id: number): Observable<void> { return this.http.delete<void>(`${this.base}/packages/templates/${id}`); }
  sellPackage(clientId: number, body: { templateId: number; purchasedOn: string | null; createInvoice: boolean; markPaid: boolean }): Observable<ClientPackage> {
    return this.http.post<ClientPackage>(`${this.base}/clients/${clientId}/packages`, body);
  }
  adjustPackage(id: number, delta: number): Observable<ClientPackage> {
    return this.http.patch<ClientPackage>(`${this.base}/client-packages/${id}/adjust`, { delta });
  }
  deleteClientPackage(id: number): Observable<void> { return this.http.delete<void>(`${this.base}/client-packages/${id}`); }

  // Cases
  cases(status: string, q: string): Observable<LegalCase[]> { return this.http.get<LegalCase[]>(`${this.base}/cases`, { params: { status, q } }); }
  legalCase(id: number): Observable<LegalCase> { return this.http.get<LegalCase>(`${this.base}/cases/${id}`); }
  saveCase(body: { clientId: number; title: string; caseNumber: string; court: string; oppositeParty: string; caseType: string; status: string; notes: string }, id?: number): Observable<LegalCase> {
    return id ? this.http.put<LegalCase>(`${this.base}/cases/${id}`, body) : this.http.post<LegalCase>(`${this.base}/cases`, body);
  }
  deleteCase(id: number): Observable<void> { return this.http.delete<void>(`${this.base}/cases/${id}`); }
  addHearing(caseId: number, body: { hearingDate: string; purpose: string; outcome: string }): Observable<LegalCase> {
    return this.http.post<LegalCase>(`${this.base}/cases/${caseId}/hearings`, body);
  }
  updateHearing(id: number, body: { hearingDate: string; purpose: string; outcome: string }): Observable<LegalCase> {
    return this.http.put<LegalCase>(`${this.base}/hearings/${id}`, body);
  }
  deleteHearing(id: number): Observable<LegalCase> { return this.http.delete<LegalCase>(`${this.base}/hearings/${id}`); }

  // Deadlines
  deadlines(): Observable<Deadline[]> { return this.http.get<Deadline[]>(`${this.base}/deadlines`); }
  saveDeadline(body: { clientId: number; title: string; category: string; period: string; dueDate: string; recurrence: string; notes: string }, id?: number): Observable<Deadline> {
    return id ? this.http.put<Deadline>(`${this.base}/deadlines/${id}`, body) : this.http.post<Deadline>(`${this.base}/deadlines`, body);
  }
  bulkDeadlines(body: { clientIds: number[]; title: string; category: string; period: string; dueDate: string; recurrence: string }): Observable<Deadline[]> {
    return this.http.post<Deadline[]>(`${this.base}/deadlines/bulk`, body);
  }
  markDeadline(id: number, done: boolean): Observable<Deadline> {
    return this.http.patch<Deadline>(`${this.base}/deadlines/${id}/done`, null, { params: { done } });
  }
  deleteDeadline(id: number): Observable<void> { return this.http.delete<void>(`${this.base}/deadlines/${id}`); }

  hours(): Observable<WorkingHours[]> {
    return this.http.get<WorkingHours[]>(`${this.base}/workspace/hours`);
  }
  updateHours(body: WorkingHours[]): Observable<WorkingHours[]> {
    return this.http.put<WorkingHours[]>(`${this.base}/workspace/hours`, body);
  }

  // Clients
  clients(q = ''): Observable<ClientSummary[]> {
    return this.http.get<ClientSummary[]>(`${this.base}/clients`, { params: q ? { q } : {} });
  }
  client(id: number): Observable<ClientDetail> {
    return this.http.get<ClientDetail>(`${this.base}/clients/${id}`);
  }
  createClient(body: ClientRequest): Observable<ClientSummary> {
    return this.http.post<ClientSummary>(`${this.base}/clients`, body);
  }
  updateClient(id: number, body: ClientRequest): Observable<ClientDetail> {
    return this.http.put<ClientDetail>(`${this.base}/clients/${id}`, body);
  }
  archiveClient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/clients/${id}`);
  }
  addNote(clientId: number, body: string, appointmentId: number | null = null): Observable<Note> {
    return this.http.post<Note>(`${this.base}/clients/${clientId}/notes`, { body, appointmentId });
  }

  // Documents
  uploadDocument(clientId: number, file: File, appointmentId: number | null = null): Observable<ClientDocument> {
    const form = new FormData();
    form.append('file', file, file.name);
    if (appointmentId !== null) form.append('appointmentId', String(appointmentId));
    return this.http.post<ClientDocument>(`${this.base}/clients/${clientId}/documents`, form);
  }
  /** Downloads through HttpClient so the login token is sent; show it with URL.createObjectURL. */
  documentBlob(id: number): Observable<Blob> {
    return this.http.get(`${this.base}/documents/${id}/file`, { responseType: 'blob' });
  }
  deleteDocument(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/documents/${id}`);
  }
  visitRecord(appointmentId: number): Observable<VisitRecord> {
    return this.http.get<VisitRecord>(`${this.base}/appointments/${appointmentId}/record`);
  }
  deleteNote(clientId: number, noteId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/clients/${clientId}/notes/${noteId}`);
  }

  // Services
  services(): Observable<ServiceOffering[]> {
    return this.http.get<ServiceOffering[]>(`${this.base}/services`);
  }
  createService(body: ServiceRequest): Observable<ServiceOffering> {
    return this.http.post<ServiceOffering>(`${this.base}/services`, body);
  }
  updateService(id: number, body: ServiceRequest): Observable<ServiceOffering> {
    return this.http.put<ServiceOffering>(`${this.base}/services/${id}`, body);
  }
  deleteService(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/services/${id}`);
  }

  // Appointments
  appointments(from: string, to: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.base}/appointments`, { params: { from, to } });
  }
  createAppointment(body: AppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.base}/appointments`, body);
  }
  updateAppointment(id: number, body: AppointmentRequest): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.base}/appointments/${id}`, body);
  }
  setAppointmentStatus(id: number, status: AppointmentStatus): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.base}/appointments/${id}/status`, { status });
  }
  deleteAppointment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/appointments/${id}`);
  }

  // Invoices
  invoices(): Observable<InvoiceSummary[]> {
    return this.http.get<InvoiceSummary[]>(`${this.base}/invoices`);
  }
  invoice(id: number): Observable<InvoiceDetail> {
    return this.http.get<InvoiceDetail>(`${this.base}/invoices/${id}`);
  }
  createInvoice(body: InvoiceRequest): Observable<InvoiceDetail> {
    return this.http.post<InvoiceDetail>(`${this.base}/invoices`, body);
  }
  updateInvoice(id: number, body: InvoiceRequest): Observable<InvoiceDetail> {
    return this.http.put<InvoiceDetail>(`${this.base}/invoices/${id}`, body);
  }
  invoiceFromAppointment(appointmentId: number): Observable<InvoiceDetail> {
    return this.http.post<InvoiceDetail>(`${this.base}/invoices/from-appointment/${appointmentId}`, {});
  }
  setInvoiceStatus(id: number, status: InvoiceStatus): Observable<InvoiceDetail> {
    return this.http.patch<InvoiceDetail>(`${this.base}/invoices/${id}/status`, { status });
  }
  deleteInvoice(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/invoices/${id}`);
  }
}
