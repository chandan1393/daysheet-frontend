import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../core/services/auth.service';
import { ToastService } from '../core/services/toast.service';
import { Appointment, InvoiceDetail, ClientDocument, Prescription } from '../core/models';
import { routeAnimation } from '../shared/animations';
import { NewAppointmentPrefill, PortalUiService, PrescriptionRequestUi } from './portal-ui.service';

interface NavItem { path: string; page: string; icon: string; exact: boolean; }

@Component({
  selector: 'app-shell',
  standalone: false,
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  animations: [routeAnimation]
})
export class ShellComponent implements OnInit, OnDestroy {
  readonly appName = environment.appName;
  get nav(): NavItem[] {
    const items: NavItem[] = [
      { path: '/app', page: 'today', icon: 'today', exact: true },
      { path: '/app/calendar', page: 'calendar', icon: 'calendar', exact: false },
      { path: '/app/clients', page: 'clients', icon: 'users', exact: false }
    ];
    if (this.auth.hasModule('CASES')) items.push({ path: '/app/cases', page: 'cases', icon: 'briefcase', exact: false });
    if (this.auth.hasModule('DEADLINES')) items.push({ path: '/app/deadlines', page: 'deadlines', icon: 'clock', exact: false });
    items.push(
      { path: '/app/services', page: 'services', icon: 'layers', exact: false },
      { path: '/app/invoices', page: 'invoices', icon: 'receipt', exact: false },
      { path: '/app/settings', page: 'settings', icon: 'sliders', exact: false }
    );
    return items;
  }

  rxRequest: PrescriptionRequestUi | null = null;
  rxView: Prescription | null = null;

  menuOpen = false;
  page = 'today';
  search = '';

  // Appointment dialogs
  formOpen = false;
  document: ClientDocument | null = null;
  editing: Appointment | null = null;
  prefill: NewAppointmentPrefill = {};
  detail: Appointment | null = null;

  // Invoice dialogs
  invoiceId: number | null = null;
  invoiceFormOpen = false;
  invoiceToEdit: InvoiceDetail | null = null;
  invoiceClientId: number | null = null;

  private subs: Subscription[] = [];

  constructor(public auth: AuthService, public ui: PortalUiService, private router: Router,
              private route: ActivatedRoute, private toast: ToastService) {}

  ngOnInit(): void {
    this.readPage();
    this.subs.push(
      this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
        this.menuOpen = false;
        this.readPage();
      }),
      this.ui.newAppointment$.subscribe(p => { this.detail = null; this.editing = null; this.prefill = p; this.formOpen = true; }),
      this.ui.editAppointment$.subscribe(a => { this.detail = null; this.editing = a; this.prefill = {}; this.formOpen = true; }),
      this.ui.showAppointment$.subscribe(a => this.detail = a),
      this.ui.showDocument$.subscribe(d => this.document = d),
      this.ui.writePrescription$.subscribe(r => { this.rxView = null; this.rxRequest = r; }),
      this.ui.showPrescription$.subscribe(p => this.rxView = p),
      this.ui.showInvoice$.subscribe(id => { this.detail = null; this.invoiceId = id; }),
      this.ui.invoiceForm$.subscribe(req => {
        this.invoiceId = null;
        this.invoiceToEdit = req.invoice ?? null;
        this.invoiceClientId = req.clientId ?? null;
        this.invoiceFormOpen = true;
      })
    );
  }

  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }

  onPrescriptionSaved(p: Prescription): void {
    this.rxRequest = null;
    this.rxView = p;
    this.ui.notifyChanged();
  }

  editPrescription(p: Prescription): void {
    this.rxView = null;
    this.rxRequest = { clientId: p.clientId, clientName: p.clientName, appointmentId: p.appointmentId, prescription: p };
  }

  onDocumentDeleted(): void {
    this.document = null;
    this.ui.notifyChanged();
  }

  label(page: string): string {
    switch (page) {
      case 'today': return 'Today';
      case 'calendar': return 'Calendar';
      case 'clients': return this.auth.term('clients');
      case 'services': return 'Services';
      case 'invoices': return 'Invoices';
      case 'cases': return 'Cases';
      case 'deadlines': return 'Deadlines';
      default: return 'Settings';
    }
  }

  routeKey(outlet: RouterOutlet): string {
    return outlet?.isActivated ? outlet.activatedRoute.snapshot.url.map(s => s.path).join('/') || 'today' : '';
  }

  get bookingUrl(): string {
    return `${location.origin}/book/${this.auth.workspace?.slug ?? ''}`;
  }

  get trialPercent(): number {
    const left = this.auth.workspace?.daysLeft ?? 0;
    return Math.max(4, Math.min(100, (left / 14) * 100));
  }

  copyLink(): void {
    navigator.clipboard?.writeText(this.bookingUrl).then(
      () => this.toast.success('Booking link copied. Paste it into WhatsApp, Instagram or your website.'),
      () => this.toast.info(this.bookingUrl)
    );
  }

  runSearch(): void {
    const q = this.search.trim();
    this.router.navigate(['/app/clients'], { queryParams: q ? { q } : {} });
    this.search = '';
  }

  onAppointmentSaved(): void {
    this.formOpen = false;
    this.ui.notifyChanged();
  }

  onDetailChanged(updated: Appointment | null): void {
    this.detail = updated;
    this.ui.notifyChanged();
  }

  onInvoiceSaved(inv: InvoiceDetail): void {
    this.invoiceFormOpen = false;
    this.ui.notifyChanged();
    this.invoiceId = inv.id;
  }

  logout(): void { this.auth.logout(); }

  private readPage(): void {
    let r = this.route;
    while (r.firstChild) r = r.firstChild;
    this.page = r.snapshot.data['page'] ?? 'today';
  }
}
