import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../core/services/api.service';
import { AuthService } from '../core/services/auth.service';
import { ToastService } from '../core/services/toast.service';
import { Appointment, AppointmentRequest, ClientSummary, ServiceOffering } from '../core/models';
import { parseLocal, toDateStr, toTimeStr } from '../core/utils/dates';
import { errorMessage } from '../core/utils/errors';
import { NewAppointmentPrefill } from './portal-ui.service';

@Component({
  selector: 'app-appointment-form',
  standalone: false,
  templateUrl: './appointment-form.component.html',
  styleUrl: './appointment-form.component.scss'
})
export class AppointmentFormComponent implements OnInit {
  @Input() appointment: Appointment | null = null;
  @Input() prefill: NewAppointmentPrefill = {};
  @Output() saved = new EventEmitter<Appointment>();
  @Output() cancelled = new EventEmitter<void>();

  clients: ClientSummary[] = [];
  services: ServiceOffering[] = [];

  clientQuery = '';
  clientId: number | null = null;
  newClient = false;
  newPhone = '';
  newEmail = '';
  showSuggestions = false;

  serviceId: number | null = null;
  date = toDateStr(new Date());
  time = '09:00';
  duration = 30;
  price: number | null = null;
  notes = '';

  saving = false;
  error = '';
  conflict = '';
  readonly durations = [10, 15, 20, 30, 45, 60, 75, 90, 120, 180];

  constructor(private api: ApiService, public auth: AuthService, private toast: ToastService) {}

  ngOnInit(): void {
    const a = this.appointment;
    if (a) {
      const start = parseLocal(a.startAt);
      this.clientId = a.clientId;
      this.clientQuery = a.clientName;
      this.serviceId = a.serviceId;
      this.date = toDateStr(start);
      this.time = toTimeStr(start);
      this.duration = a.durationMinutes;
      this.price = a.price;
      this.notes = a.notes ?? '';
    } else {
      const start = this.prefill.start ?? this.nextQuarterHour();
      this.date = toDateStr(start);
      this.time = toTimeStr(start);
      if (this.prefill.clientId) {
        this.clientId = this.prefill.clientId;
        this.clientQuery = this.prefill.clientName ?? '';
      }
    }

    this.api.clients().subscribe(list => this.clients = list);
    this.api.services().subscribe(list => {
      this.services = list;
      if (this.appointment) return;
      const wanted = list.find(x => x.id === this.prefill.serviceId);
      if (wanted) this.pickService(wanted);
      else if (list.length && this.serviceId === null) this.pickService(list[0]);
    });
  }

  get durationOptions(): number[] {
    return this.durations.includes(this.duration) ? this.durations : [...this.durations, this.duration].sort((x, y) => x - y);
  }

  get suggestions(): ClientSummary[] {
    const q = this.clientQuery.trim().toLowerCase();
    if (!q) return this.clients.slice(0, 6);
    return this.clients.filter(c =>
      c.fullName.toLowerCase().includes(q) || (c.phone ?? '').includes(q) || (c.email ?? '').toLowerCase().includes(q)
    ).slice(0, 6);
  }

  get exactMatch(): boolean {
    const q = this.clientQuery.trim().toLowerCase();
    return this.clients.some(c => c.fullName.toLowerCase() === q);
  }

  onClientInput(): void {
    this.clientId = null;
    this.newClient = false;
    this.showSuggestions = true;
  }

  chooseClient(c: ClientSummary): void {
    this.clientId = c.id;
    this.clientQuery = c.fullName;
    this.newClient = false;
    this.showSuggestions = false;
  }

  startNewClient(): void {
    this.clientId = null;
    this.newClient = true;
    this.showSuggestions = false;
  }

  hideSuggestionsSoon(): void {
    setTimeout(() => this.showSuggestions = false, 150);
  }

  pickService(s: ServiceOffering | null): void {
    this.serviceId = s?.id ?? null;
    if (s) {
      this.duration = s.durationMinutes;
      this.price = s.price;
    }
  }

  get endLabel(): string {
    if (!this.date || !this.time) return '';
    const end = parseLocal(`${this.date}T${this.time}`);
    end.setMinutes(end.getMinutes() + Number(this.duration));
    return end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  save(force = false): void {
    this.error = '';
    if (!this.clientId && !(this.newClient && this.clientQuery.trim())) {
      this.error = `Choose a ${this.auth.term('client', true)} or add a new one.`;
      return;
    }
    if (!this.date || !this.time) {
      this.error = 'Pick a date and time.';
      return;
    }

    const body: AppointmentRequest = {
      clientId: this.clientId,
      newClient: this.clientId ? null : { fullName: this.clientQuery.trim(), phone: this.newPhone, email: this.newEmail },
      serviceId: this.serviceId,
      startAt: `${this.date}T${this.time}:00`,
      durationMinutes: Number(this.duration),
      price: this.price === null || (this.price as unknown) === '' ? null : Number(this.price),
      notes: this.notes,
      force
    };

    this.saving = true;
    const req = this.appointment
      ? this.api.updateAppointment(this.appointment.id, body)
      : this.api.createAppointment(body);

    req.subscribe({
      next: a => {
        this.saving = false;
        this.toast.success(this.appointment ? 'Changes saved.' : `Booked ${a.clientName} for ${a.serviceName}.`);
        this.saved.emit(a);
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        if (err.status === 409) {
          this.conflict = errorMessage(err);
        } else {
          this.error = errorMessage(err);
        }
      }
    });
  }

  private nextQuarterHour(): Date {
    const d = new Date();
    d.setMinutes(Math.ceil((d.getMinutes() + 1) / 15) * 15, 0, 0);
    return d;
  }
}
