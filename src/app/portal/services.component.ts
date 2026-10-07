import { Component, OnInit } from '@angular/core';
import { ApiService } from '../core/services/api.service';
import { ConfirmService } from '../core/services/confirm.service';
import { ToastService } from '../core/services/toast.service';
import { PackageTemplate, ServiceOffering, ServiceRequest } from '../core/models';
import { AuthService } from '../core/services/auth.service';
import { SERVICE_COLORS } from '../core/utils/color';
import { errorMessage } from '../core/utils/errors';
import { listStagger } from '../shared/animations';

@Component({
  selector: 'app-services',
  standalone: false,
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss',
  animations: [listStagger]
})
export class ServicesComponent implements OnInit {
  services: ServiceOffering[] = [];
  loading = true;
  error = '';

  drawerOpen = false;
  editing: ServiceOffering | null = null;
  model: ServiceRequest = this.blank();
  saving = false;
  formError = '';

  readonly colors = SERVICE_COLORS;
  readonly durationPresets = [15, 30, 45, 60, 90];

  // Session packages (profession pack)
  packages: PackageTemplate[] = [];
  pkgOpen = false;
  pkgEditing: PackageTemplate | null = null;
  pkg = { name: '', sessions: 10, price: 0, validityDays: 90 as number | null, serviceId: null as number | null };

  constructor(private api: ApiService, private toast: ToastService, private confirm: ConfirmService, public auth: AuthService) {}

  ngOnInit(): void {
    this.load();
    if (this.auth.hasModule('PACKAGES')) this.loadPackages();
  }

  loadPackages(): void {
    this.api.packageTemplates().subscribe(p => this.packages = p);
  }

  openPackage(t?: PackageTemplate): void {
    this.pkgEditing = t ?? null;
    const first = this.services[0];
    this.pkg = t
      ? { name: t.name, sessions: t.sessions, price: t.price, validityDays: t.validityDays, serviceId: t.serviceId }
      : { name: first ? `${first.name}, pack of 10` : '', sessions: 10, price: first ? first.price * 9 : 0, validityDays: 90, serviceId: null };
    this.pkgOpen = true;
  }

  savePackage(): void {
    if (!this.pkg.name.trim() || this.pkg.sessions < 1) { this.toast.error('Give the package a name and at least 1 session.'); return; }
    const body = { name: this.pkg.name.trim(), sessions: Number(this.pkg.sessions), price: Number(this.pkg.price) || 0,
      validityDays: this.pkg.validityDays ? Number(this.pkg.validityDays) : null, serviceId: this.pkg.serviceId };
    this.api.savePackageTemplate(body, this.pkgEditing?.id).subscribe({
      next: () => { this.pkgOpen = false; this.toast.success('Package saved.'); this.loadPackages(); },
      error: err => this.toast.error(errorMessage(err))
    });
  }

  async removePackage(t: PackageTemplate): Promise<void> {
    const ok = await this.confirm.ask(`Stop selling ${t.name}?`, 'People who already bought it keep their sessions.', 'Stop selling');
    if (!ok) return;
    this.api.deletePackageTemplate(t.id).subscribe({ next: () => { this.pkgOpen = false; this.loadPackages(); }, error: e => this.toast.error(errorMessage(e)) });
  }

  perSession(t: { price: number; sessions: number }): number { return t.sessions ? t.price / t.sessions : 0; }

  load(): void {
    this.api.services().subscribe({
      next: list => { this.services = list; this.loading = false; this.error = ''; },
      error: err => { this.loading = false; this.error = errorMessage(err); }
    });
  }

  openNew(): void {
    this.editing = null;
    this.model = this.blank();
    this.model.color = this.colors[this.services.length % this.colors.length];
    this.formError = '';
    this.drawerOpen = true;
  }

  openEdit(s: ServiceOffering): void {
    this.editing = s;
    this.model = { name: s.name, description: s.description ?? '', durationMinutes: s.durationMinutes, price: s.price, color: s.color, bookableOnline: s.bookableOnline };
    this.formError = '';
    this.drawerOpen = true;
  }

  save(): void {
    if (!this.model.name.trim()) { this.formError = 'Give the service a name.'; return; }
    this.saving = true;
    const body: ServiceRequest = { ...this.model, durationMinutes: Number(this.model.durationMinutes), price: Number(this.model.price) || 0 };
    const req = this.editing ? this.api.updateService(this.editing.id, body) : this.api.createService(body);
    req.subscribe({
      next: s => {
        this.saving = false;
        this.drawerOpen = false;
        this.toast.success(this.editing ? `${s.name} updated.` : `${s.name} added.`);
        this.load();
      },
      error: err => { this.saving = false; this.formError = errorMessage(err); }
    });
  }

  toggleOnline(s: ServiceOffering): void {
    const body: ServiceRequest = { name: s.name, description: s.description, durationMinutes: s.durationMinutes, price: s.price, color: s.color, bookableOnline: !s.bookableOnline };
    s.bookableOnline = !s.bookableOnline;
    this.api.updateService(s.id, body).subscribe({
      next: () => this.toast.success(s.bookableOnline ? `${s.name} is now on your booking page.` : `${s.name} is hidden from your booking page.`),
      error: err => { s.bookableOnline = !s.bookableOnline; this.toast.error(errorMessage(err)); }
    });
  }

  async remove(s: ServiceOffering): Promise<void> {
    const ok = await this.confirm.ask(`Remove ${s.name}?`, 'Past appointments keep their details. It will no longer be bookable.', 'Remove');
    if (!ok) return;
    this.api.deleteService(s.id).subscribe({
      next: () => { this.toast.success(`${s.name} removed.`); this.drawerOpen = false; this.load(); },
      error: err => this.toast.error(errorMessage(err))
    });
  }

  private blank(): ServiceRequest {
    return { name: '', description: '', durationMinutes: 30, price: 0, color: SERVICE_COLORS[0], bookableOnline: true };
  }
}
