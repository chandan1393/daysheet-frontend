import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { stepSlide } from '../shared/animations';
import { ApiService } from '../core/services/api.service';
import { AuthService } from '../core/services/auth.service';
import { Profession } from '../core/models';
import { errorMessage } from '../core/utils/errors';

const CURRENCIES = ['INR', 'USD', 'GBP', 'EUR', 'AED', 'AUD', 'CAD', 'SGD', 'ZAR', 'NGN', 'MYR', 'PKR'];

/** Fallback list in case the API is not reachable while the page loads. */
const FALLBACK: Profession[] = [
  { code: 'DOCTOR', name: 'Doctor', clientLabel: 'Patient', clientLabelPlural: 'Patients', sessionLabel: 'Consultation', sampleServices: [] },
  { code: 'LAWYER', name: 'Lawyer', clientLabel: 'Client', clientLabelPlural: 'Clients', sessionLabel: 'Consultation', sampleServices: [] },
  { code: 'OTHER', name: 'Something else', clientLabel: 'Client', clientLabelPlural: 'Clients', sessionLabel: 'Appointment', sampleServices: [] }
];

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrls: ['./auth.scss', './register.component.scss'],
  animations: [stepSlide]
})
export class RegisterComponent implements OnInit {
  readonly appName = environment.appName;
  readonly currencies = CURRENCIES;
  readonly timezones: string[];
  readonly stepTitles = ['Your work', 'Your practice', 'Your login'];

  professions: Profession[] = [];
  step = 0;
  loading = false;
  error = '';
  showPassword = false;

  private readonly fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    profession: ['', Validators.required],
    workspaceName: ['', [Validators.required, Validators.maxLength(80)]],
    currency: ['INR', Validators.required],
    timezone: ['UTC', Validators.required],
    sampleData: [true],
    website: [''],
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  constructor(private api: ApiService, private auth: AuthService, private router: Router) {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    let zones: string[] = [];
    try { zones = Intl.supportedValuesOf('timeZone'); } catch { zones = []; }
    if (!zones.includes(detected)) zones = [detected, ...zones];
    if (!zones.includes('UTC')) zones = [...zones, 'UTC'];
    this.timezones = zones;
    this.form.controls.timezone.setValue(detected);

  }

  ngOnInit(): void {
    this.api.professions().subscribe({
      next: list => this.professions = list,
      error: () => this.professions = FALLBACK
    });
  }

  get selected(): Profession | undefined {
    return this.professions.find(p => p.code === this.form.controls.profession.value);
  }

  get previewSlug(): string {
    const slug = this.form.controls.workspaceName.value.toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return slug || 'your-practice';
  }

  choose(code: string): void {
    this.form.controls.profession.setValue(code);
    setTimeout(() => this.next(), 220);
  }

  next(): void {
    const fields = this.step === 0 ? ['profession'] : this.step === 1 ? ['workspaceName', 'currency', 'timezone'] : [];
    const invalid = fields.some(f => this.form.get(f)?.invalid);
    fields.forEach(f => this.form.get(f)?.markAsTouched());
    if (invalid) return;
    this.step = Math.min(2, this.step + 1);
  }

  back(): void {
    this.error = '';
    this.step = Math.max(0, this.step - 1);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (this.form.controls.profession.invalid) this.step = 0;
      else if (this.form.controls.workspaceName.invalid) this.step = 1;
      return;
    }
    this.loading = true;
    this.error = '';
    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/verify-email']),
      error: err => {
        this.loading = false;
        this.error = errorMessage(err, 'Could not create your account. Try again.');
      }
    });
  }

}
