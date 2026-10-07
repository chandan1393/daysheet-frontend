import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { ToastService } from '../core/services/toast.service';
import { Appointment, WorkingHours } from '../core/models';
import { addDays, minutesOfDay, parseLocal, sameDay, startOfDay, startOfWeek, toDateStr } from '../core/utils/dates';
import { errorMessage } from '../core/utils/errors';
import { PortalUiService } from './portal-ui.service';

interface Block { appt: Appointment; top: number; height: number; left: number; width: number; index: number; }
interface Column { date: Date; iso: string; isToday: boolean; open: boolean; blocks: Block[]; count: number; }

@Component({
  selector: 'app-calendar',
  standalone: false,
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss'
})
export class CalendarComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('scroller') scroller?: ElementRef<HTMLElement>;

  readonly hourHeight = 64;
  view: 'week' | 'day' = window.innerWidth < 760 ? 'day' : 'week';
  anchor = startOfDay(new Date());
  columns: Column[] = [];
  hours: number[] = [];
  startHour = 8;
  endHour = 20;
  loading = false;
  now = new Date();

  ghost: { col: number; top: number; label: string } | null = null;

  private appointments: Appointment[] = [];
  private workingHours: WorkingHours[] = [];
  private needsScroll = true;
  private subs: Subscription[] = [];
  private clock?: ReturnType<typeof setInterval>;

  constructor(private api: ApiService, private ui: PortalUiService, private toast: ToastService) {}

  ngOnInit(): void {
    this.api.hours().subscribe({ next: h => { this.workingHours = h; this.layout(); }, error: () => {} });
    this.load();
    this.subs.push(this.ui.changed$.subscribe(() => this.load()));
    this.clock = setInterval(() => this.now = new Date(), 60_000);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    clearInterval(this.clock);
  }

  ngAfterViewChecked(): void {
    if (this.needsScroll && this.scroller && this.columns.length && !this.loading) {
      this.needsScroll = false;
      // Start at the first appointment in view (or opening time), so mornings aren't hidden.
      const tops = this.columns.flatMap(c => c.blocks.map(b => b.top));
      const top = tops.length ? Math.min(...tops) - this.hourHeight / 2 : this.hourHeight;
      this.scroller.nativeElement.scrollTop = Math.max(0, top);
    }
  }

  get rangeLabel(): string {
    if (!this.columns.length) return '';
    const first = this.columns[0].date;
    const last = this.columns[this.columns.length - 1].date;
    if (this.view === 'day') return first.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const sameMonth = first.getMonth() === last.getMonth();
    const a = first.toLocaleDateString([], sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'short' });
    const b = last.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
    return `${a} – ${b}`;
  }

  get nowTop(): number | null {
    const m = minutesOfDay(this.now);
    if (m < this.startHour * 60 || m > this.endHour * 60) return null;
    return ((m - this.startHour * 60) / 60) * this.hourHeight;
  }

  get gridHeight(): number { return (this.endHour - this.startHour) * this.hourHeight; }

  setView(v: 'week' | 'day'): void {
    this.view = v;
    this.load();
  }

  shift(direction: number): void {
    this.anchor = addDays(this.anchor, direction * (this.view === 'week' ? 7 : 1));
    this.load();
  }

  goToday(): void {
    this.anchor = startOfDay(new Date());
    this.needsScroll = true;
    this.load();
  }

  openDay(col: Column): void {
    this.anchor = col.date;
    this.setView('day');
  }

  load(): void {
    const first = this.view === 'week' ? startOfWeek(this.anchor) : this.anchor;
    const count = this.view === 'week' ? 7 : 1;
    const days = Array.from({ length: count }, (_, i) => addDays(first, i));
    this.columns = days.map(d => this.emptyColumn(d));
    this.loading = true;
    this.api.appointments(toDateStr(days[0]), toDateStr(days[days.length - 1])).subscribe({
      next: list => { this.appointments = list; this.loading = false; this.layout(); },
      error: err => { this.loading = false; this.toast.error(errorMessage(err, 'Could not load the calendar.')); }
    });
  }

  onColumnMove(event: MouseEvent, colIndex: number): void {
    const target = event.target as HTMLElement;
    if (target.closest('.blk')) { this.ghost = null; return; }
    const minutes = this.minutesAt(event);
    const top = ((minutes - this.startHour * 60) / 60) * this.hourHeight;
    const d = new Date();
    d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    this.ghost = { col: colIndex, top, label: d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) };
  }

  onColumnClick(event: MouseEvent, col: Column): void {
    if ((event.target as HTMLElement).closest('.blk')) return;
    const minutes = this.minutesAt(event);
    const start = new Date(col.date);
    start.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    this.ui.newAppointment({ start });
  }

  open(a: Appointment, event: Event): void {
    event.stopPropagation();
    this.ui.showAppointment(a);
  }

  hourLabel(h: number): string {
    const d = new Date();
    d.setHours(h, 0, 0, 0);
    return d.toLocaleTimeString([], { hour: 'numeric' });
  }

  private minutesAt(event: MouseEvent): number {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const y = Math.max(0, event.clientY - rect.top);
    const raw = this.startHour * 60 + (y / this.hourHeight) * 60;
    return Math.min(this.endHour * 60 - 30, Math.floor(raw / 30) * 30);
  }

  private emptyColumn(date: Date): Column {
    const iso = (date.getDay() + 6) % 7 + 1;
    const wh = this.workingHours.find(h => h.dayOfWeek === iso);
    return { date, iso: toDateStr(date), isToday: sameDay(date, new Date()), open: wh ? wh.enabled : true, blocks: [], count: 0 };
  }

  private layout(): void {
    // Visible hours: working hours, stretched to fit any appointment outside them.
    const enabled = this.workingHours.filter(h => h.enabled);
    let start = enabled.length ? Math.min(...enabled.map(h => parseInt(h.startTime, 10))) : 8;
    let end = enabled.length ? Math.max(...enabled.map(h => Math.ceil(parseInt(h.endTime, 10) + (h.endTime.endsWith(':00') ? 0 : 1)))) : 20;
    for (const a of this.appointments) {
      const s = parseLocal(a.startAt);
      const e = parseLocal(a.endAt);
      start = Math.min(start, s.getHours());
      end = Math.max(end, sameDay(s, e) ? Math.ceil(minutesOfDay(e) / 60) : 24);
    }
    this.startHour = Math.max(0, Math.min(start, 22));
    this.endHour = Math.min(24, Math.max(end, this.startHour + 2));
    this.hours = Array.from({ length: this.endHour - this.startHour }, (_, i) => this.startHour + i);

    this.columns = this.columns.map(c => {
      const col = this.emptyColumn(c.date);
      const items = this.appointments
        .filter(a => a.startAt.startsWith(col.iso))
        .map(a => {
          const s = minutesOfDay(parseLocal(a.startAt));
          let e = minutesOfDay(parseLocal(a.endAt));
          if (e <= s) e = 24 * 60;
          return { a, s, e, lane: 0, lanes: 1 };
        })
        .sort((x, y) => x.s - y.s || y.e - x.e);

      // Group overlapping appointments and give each a lane so they sit side by side.
      let cluster: typeof items = [];
      let laneEnds: number[] = [];
      let clusterEnd = -1;
      const flush = () => { cluster.forEach(i => i.lanes = laneEnds.length); cluster = []; laneEnds = []; };
      for (const it of items) {
        if (it.s >= clusterEnd) { flush(); clusterEnd = -1; }
        let lane = laneEnds.findIndex(end => end <= it.s);
        if (lane === -1) { lane = laneEnds.length; laneEnds.push(it.e); } else { laneEnds[lane] = it.e; }
        it.lane = lane;
        cluster.push(it);
        clusterEnd = Math.max(clusterEnd, it.e);
      }
      flush();

      col.blocks = items.map((it, index) => ({
        appt: it.a,
        top: ((it.s - this.startHour * 60) / 60) * this.hourHeight,
        height: Math.max(24, ((it.e - it.s) / 60) * this.hourHeight - 3),
        left: (it.lane / it.lanes) * 100,
        width: 100 / it.lanes,
        index
      }));
      col.count = items.filter(i => i.a.status !== 'CANCELLED').length;
      return col;
    });
  }
}
