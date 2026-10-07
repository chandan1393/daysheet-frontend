import { Component } from '@angular/core';
import { fadeSlide } from '../../shared/animations';
import { addDays, startOfWeek } from '../../core/utils/dates';

type TabKey = 'today' | 'calendar' | 'profile' | 'invoices';
interface TourTab { key: TabKey; label: string; icon: string; title: string; text: string; points: string[]; }
interface CalBlock { top: number; height: number; color: string; name: string; svc: string; }

const C = { lagoon: '#0E7C86', iris: '#6D5DF6', rose: '#E5487A', marigold: '#F2A20C', sage: '#4C9A6A' };

/** A clickable look inside the app, framed like a browser window. */
@Component({
  selector: 'app-landing-tour',
  standalone: false,
  templateUrl: './tour.component.html',
  styleUrl: './tour.component.scss',
  animations: [fadeSlide]
})
export class LandingTourComponent {
  readonly tabs: TourTab[] = [
    {
      key: 'today', label: 'Today', icon: 'today',
      title: 'Know your day in one look',
      text: 'Open Daysheet in the morning and see who is coming, what is paid and what is still owed.',
      points: ['Who is next, and for what', 'Money in this month, compared with last', 'Mark someone seen or bill them in one tap']
    },
    {
      key: 'calendar', label: 'Calendar', icon: 'calendar',
      title: 'A week you can read at a glance',
      text: 'Every service has its own colour, so a busy week still makes sense in two seconds.',
      points: ['Click any gap to book it', 'Warns you before you double-book', 'Week view on a laptop, day view on your phone']
    },
    {
      key: 'profile', label: 'Profiles', icon: 'user',
      title: 'Everything about a person on one page',
      text: 'Before someone walks in, see their last visit, your notes and what they have paid.',
      points: ['Every visit numbered, with its notes and files', 'Prescriptions and reports a tap away', 'Last visit shown when they arrive']
    },
    {
      key: 'invoices', label: 'Invoices', icon: 'receipt',
      title: 'Know who has paid, and who hasn\'t',
      text: 'Turn a visit into an invoice, print it or send a ready-written message, and mark it paid.',
      points: ['Tax and numbering done for you', 'Print or save as PDF', 'Overdue amounts stand out']
    }
  ];
  active = this.tabs[0];

  readonly todayRows = [
    { time: '09:30', name: 'Aarav Mehta', svc: 'Initial assessment', color: C.lagoon, state: 'done', label: 'Seen' },
    { time: '11:00', name: 'Emma Lawson', svc: 'Treatment session', color: C.iris, state: 'done', label: 'Seen' },
    { time: '14:00', name: 'Rohan Iyer', svc: 'Sports massage', color: C.rose, state: 'next', label: 'Next' },
    { time: '16:30', name: 'Maya Fernandes', svc: 'Treatment session', color: C.iris, state: 'booked', label: 'Confirmed' }
  ];

  readonly calHours = ['9', '10', '11', '12', '1', '2', '3', '4', '5'];
  readonly calDays = Array.from({ length: 5 }, (_, i) => {
    const d = addDays(startOfWeek(new Date()), i);
    return { label: d.toLocaleDateString([], { weekday: 'short' }), date: d.getDate(), today: i === (new Date().getDay() + 6) % 7 };
  });
  readonly calCols: CalBlock[][] = [
    [b(2, 12, C.lagoon, 'Aarav', 'Assessment'), b(45, 9, C.iris, 'Emma', 'Treatment'), b(70, 9, C.rose, 'Rohan', 'Massage')],
    [b(12, 9, C.iris, 'Priya', 'Treatment'), b(56, 12, C.lagoon, 'Daniel', 'Assessment')],
    [b(0, 9, C.sage, 'Sara', 'Follow-up'), b(23, 9, C.iris, 'Lucas', 'Treatment'), b(48, 6, C.rose, 'Noah', 'Massage'), b(80, 9, C.iris, 'Maya', 'Treatment')],
    [b(34, 12, C.lagoon, 'Ananya', 'Assessment'), b(68, 9, C.iris, 'Aarav', 'Treatment')],
    [b(6, 9, C.iris, 'Emma', 'Treatment'), b(28, 6, C.rose, 'Kabir', 'Massage'), b(58, 9, C.sage, 'Priya', 'Follow-up')]
  ];

  readonly notes = [
    { date: 'Today', text: 'Good progress since last visit. Review again in two weeks.' },
    { date: '18 Sep', text: 'Prefers morning slots. WhatsApp reminders work best.' },
    { date: '2 Sep', text: 'First visit. Agreed a six-week plan.' }
  ];

  readonly invoiceRows = [
    { no: 'INV-0142', name: 'Aarav Mehta', state: 'paid', label: 'Paid', amount: '₹2,200' },
    { no: 'INV-0141', name: 'Emma Lawson', state: 'unpaid', label: 'Unpaid', amount: '₹900' },
    { no: 'INV-0140', name: 'Rohan Iyer', state: 'overdue', label: 'Overdue', amount: '₹1,800' },
    { no: 'INV-0139', name: 'Priya Nair', state: 'paid', label: 'Paid', amount: '₹1,200' }
  ];

  select(t: TourTab): void { this.active = t; }
}

function b(top: number, height: number, color: string, name: string, svc: string): CalBlock {
  return { top, height, color, name, svc };
}
