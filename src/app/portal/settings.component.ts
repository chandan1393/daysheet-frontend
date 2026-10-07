import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { ApiService } from '../core/services/api.service';
import { AuthService } from '../core/services/auth.service';
import { ToastService } from '../core/services/toast.service';
import { BillingDetails, GstState, PackModule, PaymentRecord, PricePlan, Profession, WorkingHours, WorkspaceUpdate } from '../core/models';
import { RazorpayService } from '../core/services/razorpay.service';
import { firstValueFrom } from 'rxjs';
import { errorMessage } from '../core/utils/errors';
import { fadeSlide } from '../shared/animations';

type Tab = 'practice' | 'words' | 'features' | 'hours' | 'booking' | 'plan';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

@Component({
  selector: 'app-settings',
  standalone: false,
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  animations: [fadeSlide]
})
export class SettingsComponent implements OnInit {
  tab: Tab = 'practice';
  readonly tabs: { key: Tab; label: string }[] = [
    { key: 'practice', label: 'Practice' }, { key: 'words', label: 'Your words' }, { key: 'features', label: 'Features' }, { key: 'hours', label: 'Opening hours' },
    { key: 'booking', label: 'Booking page' }, { key: 'plan', label: 'Plan' }
  ];

  model!: WorkspaceUpdate;
  hours: WorkingHours[] = [];
  professions: Profession[] = [];
  saving = false;
  savingHours = false;

  readonly currencies = ['INR', 'USD', 'GBP', 'EUR', 'AED', 'AUD', 'CAD', 'SGD', 'ZAR', 'NGN', 'MYR', 'PKR'];
  readonly slotOptions = [10, 15, 20, 30, 45, 60];
  readonly timezones: string[];
  readonly dayNames = DAY_NAMES;
  readonly contactEmail = environment.contactEmail;
  plans: PricePlan[] = [];
  payments: PaymentRecord[] = [];
  payingCode: string | null = null;
  billing: BillingDetails = { name: '', address: '', stateCode: '', gstin: '' };
  billingSaved = false;
  savingBilling = false;
  states: GstState[] = [];
  invoiceId: number | null = null;

  constructor(public auth: AuthService, private api: ApiService, private toast: ToastService,
              private route: ActivatedRoute, private router: Router, private razorpay: RazorpayService) {
    let zones: string[] = [];
    try { zones = Intl.supportedValuesOf('timeZone'); } catch { zones = []; }
    const current = auth.workspace?.timezone ?? 'UTC';
    if (!zones.includes(current)) zones = [current, ...zones];
    this.timezones = zones;
  }

  ngOnInit(): void {
    const t = this.route.snapshot.queryParamMap.get('tab') as Tab | null;
    if (t && this.tabs.some(x => x.key === t)) this.tab = t;
    this.resetModel();
    this.api.hours().subscribe(h => this.hours = h);
    this.api.professions().subscribe(p => this.professions = p);
    this.loadBilling();
  }

  selectTab(t: Tab): void {
    this.tab = t;
    this.router.navigate([], { queryParams: { tab: t }, replaceUrl: true });
  }

  resetModel(): void {
    const w = this.auth.workspace;
    this.model = {
      name: w?.name ?? '', phone: w?.phone ?? '', email: w?.email ?? '', address: w?.address ?? '',
      currency: w?.currency ?? 'USD', timezone: w?.timezone ?? 'UTC',
      clientLabel: w?.clientLabel ?? 'Client', clientLabelPlural: w?.clientLabelPlural ?? 'Clients',
      sessionLabel: w?.sessionLabel ?? 'Appointment', slotMinutes: w?.slotMinutes ?? 30,
      practitionerTitle: w?.practitionerTitle ?? '', registrationNumber: w?.registrationNumber ?? ''
    };
  }

  applyPreset(p: Profession): void {
    this.model.clientLabel = p.clientLabel;
    this.model.clientLabelPlural = p.clientLabelPlural;
    this.model.sessionLabel = p.sessionLabel;
  }

  save(): void {
    this.saving = true;
    this.api.updateWorkspace(this.model).subscribe({
      next: w => { this.saving = false; this.auth.setWorkspace(w); this.resetModel(); this.toast.success('Settings saved.'); },
      error: err => { this.saving = false; this.toast.error(errorMessage(err)); }
    });
  }

  saveHours(): void {
    this.savingHours = true;
    this.api.updateHours(this.hours).subscribe({
      next: h => { this.savingHours = false; this.hours = h; this.toast.success('Opening hours saved.'); },
      error: err => { this.savingHours = false; this.toast.error(errorMessage(err)); }
    });
  }

  copyFromMonday(): void {
    const mon = this.hours.find(h => h.dayOfWeek === 1);
    if (!mon) return;
    this.hours = this.hours.map(h => h.enabled && h.dayOfWeek <= 5 ? { ...h, startTime: mon.startTime, endTime: mon.endTime } : h);
  }

  get bookingUrl(): string { return `${location.origin}/book/${this.auth.workspace?.slug ?? ''}`; }

  copyLink(): void {
    navigator.clipboard?.writeText(this.bookingUrl).then(() => this.toast.success('Booking link copied.'));
  }

  get whatsappShare(): string {
    const text = `Book your ${this.model.sessionLabel.toLowerCase()} with ${this.model.name} online: ${this.bookingUrl}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  readonly moduleInfo: { key: PackModule; title: string; text: string; icon: string; for: string }[] = [
    { key: 'PRESCRIPTIONS', title: 'Prescriptions', icon: 'pill', for: 'Doctors and dentists',
      text: 'Medicines with dose, frequency and duration, printed on your letterhead. Repeat the last prescription in one tap and send it on WhatsApp.' },
    { key: 'PACKAGES', title: 'Session packages', icon: 'package', for: 'Physios, therapists, coaches, salons and tutors',
      text: 'Sell several sessions at once. Each completed visit uses one up automatically, and you see how many are left.' },
    { key: 'CASES', title: 'Cases and hearings', icon: 'briefcase', for: 'Lawyers',
      text: 'Case number, court and opposite party, a hearing timeline, and an email the evening before every hearing.' },
    { key: 'DEADLINES', title: 'Compliance deadlines', icon: 'clock', for: 'CAs and tax consultants',
      text: 'GST, TDS and ITR due dates for every client. Add a filing for many clients at once; recurring ones roll over automatically.' }
  ];
  savingModules = false;

  isOn(m: PackModule): boolean { return this.auth.hasModule(m); }

  toggleModule(m: PackModule): void {
    const current = this.auth.workspace?.modules ?? [];
    const next = current.includes(m) ? current.filter(x => x !== m) : [...current, m];
    this.savingModules = true;
    this.api.updateModules(next).subscribe({
      next: w => {
        this.savingModules = false;
        this.auth.setWorkspace(w);
        const info = this.moduleInfo.find(x => x.key === m);
        this.toast.success(`${info?.title} ${next.includes(m) ? 'switched on' : 'switched off'}.`);
      },
      error: e => { this.savingModules = false; this.toast.error(errorMessage(e)); }
    });
  }

  loadBilling(): void {
    this.api.plans().subscribe(p => this.plans = p);
    if (!this.states.length) this.api.gstStates().subscribe(st => this.states = st);
    this.api.billingDetails().subscribe(b => { this.billing = b; this.billingSaved = !!b.stateCode; });
    this.api.payments().subscribe({ next: p => this.payments = p, error: () => this.payments = [] });
  }

  rupees(paise: number, decimals = 0): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: decimals, maximumFractionDigits: decimals })
      .format(paise / 100);
  }

  saveBilling(): void {
    const gstin = this.billing.gstin.trim().toUpperCase();
    if (!this.billing.name.trim() || !this.billing.address.trim() || !this.billing.stateCode) {
      this.toast.error('Fill in the name, address and state for your invoice.');
      return;
    }
    if (gstin && gstin.slice(0, 2) !== this.billing.stateCode) {
      this.toast.error('The first two digits of your GSTIN should match your state.');
      return;
    }
    this.savingBilling = true;
    this.api.saveBillingDetails({ ...this.billing, gstin }).subscribe({
      next: b => { this.savingBilling = false; this.billing = b; this.billingSaved = true; this.toast.success('Billing details saved.'); },
      error: err => { this.savingBilling = false; this.toast.error(errorMessage(err)); }
    });
  }

  /** Server creates the order (amount fixed there), Razorpay takes the money, server checks the signature. */
  async pay(plan: PricePlan): Promise<void> {
    if (this.payingCode) return;
    if (!this.billingSaved) { this.toast.error('Add your billing details first. They go on your GST invoice.'); return; }
    this.payingCode = plan.code;
    try {
      const checkout = await firstValueFrom(this.api.createOrder(plan.code));
      const result = await this.razorpay.pay(checkout);
      const workspace = await firstValueFrom(this.api.verifyPayment({
        razorpayOrderId: result.razorpay_order_id,
        razorpayPaymentId: result.razorpay_payment_id,
        razorpaySignature: result.razorpay_signature
      }));
      this.auth.setWorkspace(workspace);
      this.toast.success(`Payment received. Your plan is active until ${this.date(workspace.subscriptionEndsAt)}.`);
      this.loadBilling();
    } catch (err) {
      const message = err instanceof Error ? err.message : errorMessage(err, 'The payment did not go through.');
      if (message !== 'dismissed') this.toast.error(message);
    } finally {
      this.payingCode = null;
    }
  }

  /** For people who'd rather pay by bank transfer or have questions first. */
  mailto(plan: PricePlan): string {
    const w = this.auth.workspace;
    const subject = `Daysheet ${plan.name} plan for ${w?.name ?? 'my practice'}`;
    const body = `Hi,\n\nI'd like the ${plan.name} plan (${this.rupees(plan.totalPaise)} per ${plan.intervalLabel}).\n\n`
      + `Practice: ${w?.name ?? ''}\nAccount email: ${this.auth.user?.email ?? ''}\nBooking page: ${this.bookingUrl}\n\n`
      + `Please send bank transfer details.\n`;
    return `mailto:${this.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  date(value: string | null | undefined): string {
    return value ? new Date(value).toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  }

  get trialEnds(): string {
    const t = this.auth.workspace?.trialEndsAt;
    return t ? new Date(t).toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  }
}
