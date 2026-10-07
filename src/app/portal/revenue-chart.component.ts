import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { MonthRevenue } from '../core/models';

interface Point { x: number; y: number; label: string; amount: number; }

/** Hand-drawn SVG area chart: no chart library needed. */
@Component({
  selector: 'app-revenue-chart',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chart" (mouseleave)="hover = null">
      <div class="plot">
        <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" preserveAspectRatio="none" role="img"
             [attr.aria-label]="'Paid per month: ' + summary">
          <defs>
            <linearGradient id="rev-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stop-color="#0E7C86" stop-opacity=".28" />
              <stop offset="1" stop-color="#0E7C86" stop-opacity="0" />
            </linearGradient>
          </defs>
          @for (g of grid; track g) {
            <line [attr.x1]="0" [attr.x2]="W" [attr.y1]="g" [attr.y2]="g" class="grid" />
          }
          <path [attr.d]="areaPath" fill="url(#rev-fill)" class="area" />
          <path [attr.d]="linePath" class="line" pathLength="1" />
          @for (p of points; track p.label; let i = $index) {
            <rect [attr.x]="p.x - colW / 2" y="0" [attr.width]="colW" [attr.height]="H" fill="transparent" (mouseenter)="hover = i" />
          }
        </svg>
        @for (p of points; track p.label; let i = $index) {
          <span class="pt" [class.on]="hover === i" [style.left.%]="(p.x / W) * 100" [style.top.%]="(p.y / H) * 100"></span>
        }
        @if (hover !== null) {
          <div class="tip" [style.left.%]="(points[hover].x / W) * 100" [style.top.%]="(points[hover].y / H) * 100">
            <strong>{{ points[hover].amount | money }}</strong><span>{{ points[hover].label }} {{ data[hover].year }}</span>
          </div>
        }
      </div>
      <div class="labels">@for (p of points; track p.label) { <span>{{ p.label }}</span> }</div>
    </div>`,
  styles: [`
    .plot { position: relative; height: 170px; }
    svg { width: 100%; height: 100%; overflow: visible; }
    .grid { stroke: var(--line); stroke-dasharray: 3 5; vector-effect: non-scaling-stroke; }
    .area { animation: fade .9s .3s both ease-out; }
    .line {
      fill: none; stroke: var(--lagoon); stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round;
      vector-effect: non-scaling-stroke; stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw 1.1s .1s forwards cubic-bezier(.6,.1,.3,1);
    }
    .pt {
      position: absolute; width: 9px; height: 9px; margin: -4.5px 0 0 -4.5px; border-radius: 50%; pointer-events: none;
      background: #fff; border: 2.5px solid var(--lagoon); transition: transform .2s var(--ease-spring), background-color .2s;
      animation: fade .4s 1s both;
    }
    .pt.on { background: var(--lagoon); transform: scale(1.35); }
    .labels { display: flex; justify-content: space-between; margin-top: 8px; font-size: 12px; color: var(--faint); padding: 0 2px; }
    .tip {
      position: absolute; transform: translate(-50%, calc(-100% - 12px)); background: var(--ink); color: #fff; pointer-events: none;
      padding: 6px 10px; border-radius: 9px; font-size: 12px; white-space: nowrap; display: flex; flex-direction: column; align-items: center;
      box-shadow: var(--shadow-2);
    }
    .tip strong { font-size: 14px; font-family: var(--font-display); }
    .tip span { color: #9FB0C8; }
    @keyframes draw { to { stroke-dashoffset: 0; } }
    @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class RevenueChartComponent implements OnChanges {
  @Input() data: MonthRevenue[] = [];

  readonly W = 600;
  readonly H = 170;
  readonly grid = [10, 63, 116, 169];
  points: Point[] = [];
  linePath = '';
  areaPath = '';
  colW = 100;
  hover: number | null = null;
  summary = '';

  ngOnChanges(): void {
    const values = this.data.map(d => Number(d.amount) || 0);
    const max = Math.max(...values, 1) * 1.15;
    const n = Math.max(this.data.length - 1, 1);
    const padX = 14;
    this.colW = (this.W - padX * 2) / n;
    this.points = this.data.map((d, i) => ({
      x: padX + (i * (this.W - padX * 2)) / n,
      y: this.H - 8 - ((Number(d.amount) || 0) / max) * (this.H - 24),
      label: d.label,
      amount: Number(d.amount) || 0
    }));
    this.linePath = this.smooth(this.points);
    const last = this.points[this.points.length - 1];
    const first = this.points[0];
    this.areaPath = this.points.length
      ? `${this.linePath} L ${last.x} ${this.H} L ${first.x} ${this.H} Z`
      : '';
    this.summary = this.data.map(d => `${d.label} ${d.amount}`).join(', ');
  }

  /** Catmull-Rom style curve through the points for a soft line. */
  private smooth(pts: Point[]): string {
    if (!pts.length) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] ?? pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] ?? p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  }
}
