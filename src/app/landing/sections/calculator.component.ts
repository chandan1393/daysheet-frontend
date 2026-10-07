import { Component, Input } from '@angular/core';

const FEE_RANGE = { min: 200, max: 5000, step: 50, start: 800 };

/** Lets a visitor put their own numbers in and see what missed appointments cost them. */
@Component({
  selector: 'app-landing-calculator',
  standalone: false,
  templateUrl: './calculator.component.html',
  styleUrl: './calculator.component.scss'
})
export class LandingCalculatorComponent {
  /** Monthly plan price in rupees, from the database. */
  @Input() monthlyPrice = 799;

  perWeek = 40;
  rate = 8;
  fee = FEE_RANGE.start;

  readonly fmt = (n: number) => this.money(n);

  readonly range = FEE_RANGE;
  get missedPerMonth(): number { return (this.perWeek * this.rate / 100) * 52 / 12; }
  get lostMonthly(): number { return this.missedPerMonth * this.fee; }
  get lostYearly(): number { return this.lostMonthly * 12; }
  get breakEven(): number { return Math.max(1, Math.ceil(this.monthlyPrice / Math.max(1, this.fee))); }

  fill(value: number, min: number, max: number): string {
    return `${((value - min) / (max - min)) * 100}%`;
  }

  money(n: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.round(n));
  }
}
