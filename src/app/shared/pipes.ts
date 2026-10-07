import { Pipe, PipeTransform } from '@angular/core';
import { AuthService } from '../core/services/auth.service';
import { formatDayLabel, formatTime, parseLocal } from '../core/utils/dates';

/** Formats money in the practice's currency: {{ 1500 | money }} → ₹1,500 */
@Pipe({ name: 'money', standalone: false, pure: false })
export class MoneyPipe implements PipeTransform {
  private cache = new Map<string, Intl.NumberFormat>();

  constructor(private auth: AuthService) {}

  transform(value: number | null | undefined, currency?: string, decimals = 0): string {
    if (value === null || value === undefined) return '—';
    const cur = currency || this.auth.workspace?.currency || 'USD';
    const key = `${cur}-${decimals}`;
    let fmt = this.cache.get(key);
    if (!fmt) {
      try {
        fmt = new Intl.NumberFormat(undefined, { style: 'currency', currency: cur, minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      } catch {
        fmt = new Intl.NumberFormat(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      }
      this.cache.set(key, fmt);
    }
    return fmt.format(Number(value));
  }
}

/** {{ 'clients' | term }} → "Patients" for a clinic, "Students" for a tutor. */
@Pipe({ name: 'term', standalone: false, pure: false })
export class TermPipe implements PipeTransform {
  constructor(private auth: AuthService) {}

  transform(key: 'client' | 'clients' | 'session' | 'sessions', lower = false): string {
    return this.auth.term(key, lower);
  }
}

/** Wall-clock time from an API date-time string: "2026-10-03T14:00:00" → "2:00 PM" */
@Pipe({ name: 'hm', standalone: false })
export class TimePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return value ? formatTime(parseLocal(value)) : '';
  }
}

/** "Today", "Tomorrow" or "Mon, 6 Oct" */
@Pipe({ name: 'dayLabel', standalone: false })
export class DayLabelPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return value ? formatDayLabel(parseLocal(value)) : '';
  }
}

/** 75 → "1 h 15 min" */
@Pipe({ name: 'duration', standalone: false })
export class DurationPipe implements PipeTransform {
  transform(minutes: number | null | undefined): string {
    if (!minutes) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return [h ? `${h} h` : '', m ? `${m} min` : ''].filter(Boolean).join(' ');
  }
}
