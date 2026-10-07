import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ApiService } from '../core/services/api.service';
import { BookingConfirmation, PublicPractice, ServiceOffering } from '../core/models';
import { addDays, parseLocal, toDateStr } from '../core/utils/dates';
import { errorMessage } from '../core/utils/errors';
import { stepSlide } from '../shared/animations';
import { environment } from '../../environments/environment';

interface DayOption { date: Date; iso: string; open: boolean; }

@Component({
  selector: 'app-booking-page',
  standalone: false,
  templateUrl: './booking-page.component.html',
  styleUrl: './booking-page.component.scss',
  animations: [stepSlide]
})
export class BookingPageComponent implements OnInit {
  readonly appName = environment.appName;
  slug = '';
  practice?: PublicPractice;
  loadError = '';
  step = 0;

  service?: ServiceOffering;
  days: DayOption[] = [];
  day?: DayOption;
  slots: string[] = [];
  slotsLoading = false;
  time = '';

  submitting = false;
  submitError = '';
  confirmation?: BookingConfirmation;

  private readonly fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    phone: ['', [Validators.required, Validators.minLength(6)]],
    email: ['', Validators.email],
    notes: [''],
    website: ['']
  });

  constructor(private route: ActivatedRoute, private api: ApiService, private title: Title) {}

  ngOnInit(): void {
    this.slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.api.practice(this.slug).subscribe({
      next: p => {
        this.practice = p;
        this.title.setTitle(`Book with ${p.name}`);
        const today = parseLocal(p.today);
        this.days = Array.from({ length: 21 }, (_, i) => {
          const date = addDays(today, i);
          const iso = (date.getDay() + 6) % 7 + 1; // ISO weekday
          return { date, iso: toDateStr(date), open: p.openDays.includes(iso) };
        });
      },
      error: err => this.loadError = err.status === 404
        ? 'This booking page does not exist. Check the link you were given.'
        : errorMessage(err, 'This booking page could not be loaded.')
    });
  }

  chooseService(s: ServiceOffering): void {
    this.service = s;
    this.time = '';
    this.step = 1;
    const first = this.day?.open ? this.day : this.days.find(d => d.open);
    if (first) this.chooseDay(first);
  }

  chooseDay(d: DayOption): void {
    if (!d.open || !this.service) return;
    this.day = d;
    this.time = '';
    this.slots = [];
    this.slotsLoading = true;
    this.api.slots(this.slug, this.service.id, d.iso).subscribe({
      next: r => { this.slots = r.slots; this.slotsLoading = false; },
      error: () => { this.slots = []; this.slotsLoading = false; }
    });
  }

  chooseTime(t: string): void {
    this.time = t;
    setTimeout(() => this.step = 2, 180);
  }

  back(): void {
    this.submitError = '';
    this.step = Math.max(0, this.step - 1);
  }

  submit(): void {
    if (this.form.invalid || !this.service || !this.day || !this.time) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting = true;
    this.submitError = '';
    this.api.book(this.slug, { serviceId: this.service.id, date: this.day.iso, time: this.time, ...this.form.getRawValue() })
      .subscribe({
        next: c => { this.confirmation = c; this.submitting = false; this.step = 3; },
        error: err => {
          this.submitting = false;
          this.submitError = errorMessage(err, 'Could not book this time. Try another slot.');
          if (err.status === 409 && this.day) { this.step = 1; this.chooseDay(this.day); }
        }
      });
  }

  money(n: number): string {
    if (!n) return 'Free';
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: this.practice?.currency ?? 'USD', maximumFractionDigits: 0 }).format(n);
    } catch {
      return String(n);
    }
  }

  dayName(d: Date): string { return d.toLocaleDateString([], { weekday: 'short' }); }
  monthName(d: Date): string { return d.toLocaleDateString([], { month: 'short' }); }

  longDate(d?: Date): string {
    return d ? d.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' }) : '';
  }

  /** Lets the client save the booking to their own calendar. */
  downloadIcs(): void {
    if (!this.confirmation) return;
    const fmt = (s: string) => s.replace(/[-:]/g, '').slice(0, 15);
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Daysheet//Booking//EN', 'BEGIN:VEVENT',
      `UID:booking-${this.confirmation.id}@daysheet.in`,
      `DTSTART:${fmt(this.confirmation.startAt)}`,
      `DTEND:${fmt(this.confirmation.endAt)}`,
      `SUMMARY:${this.confirmation.serviceName} with ${this.confirmation.practiceName}`,
      this.practice?.address ? `LOCATION:${this.practice.address.replace(/[,;]/g, ' ')}` : '',
      'END:VEVENT', 'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'appointment.ics';
    a.click();
    URL.revokeObjectURL(url);
  }

  bookAnother(): void {
    this.confirmation = undefined;
    this.service = undefined;
    this.time = '';
    this.form.reset();
    this.step = 0;
  }
}
