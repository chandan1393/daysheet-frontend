import { Component } from '@angular/core';

interface Group { title: string; icon: string; color: string; items: string[]; }
interface ProfessionTile { who: string; icon: string; color: string; title: string; text: string; }

/** Everything included, laid out like ruled pages in a day-book. Only lists features that exist. */
@Component({
  selector: 'app-landing-features',
  standalone: false,
  templateUrl: './features.component.html',
  styleUrl: './features.component.scss'
})
export class LandingFeaturesComponent {
  /** The horizontal band under the four columns: what each profession gets on top. */
  readonly professions: ProfessionTile[] = [
    { who: 'Doctors, dentists', icon: 'pill', color: '#0E7C86', title: 'Prescriptions',
      text: 'On your letterhead with registration number. Repeat the last one in a tap, send it on WhatsApp.' },
    { who: 'Physios, salons, tutors', icon: 'package', color: '#6D5DF6', title: 'Session packages',
      text: 'Sell 10 sessions at once. Every completed visit counts down by itself.' },
    { who: 'Lawyers', icon: 'briefcase', color: '#E5487A', title: 'Cases and hearings',
      text: 'Case number, court and hearing timeline, with an email the evening before.' },
    { who: 'CAs, tax consultants', icon: 'clock', color: '#B8740A', title: 'Filing deadlines',
      text: 'GST, TDS and ITR due dates for every client, added for many clients at once.' }
  ];

  readonly groups: Group[] = [
    {
      title: 'Bookings', icon: 'calendar', color: '#0E7C86',
      items: [
        'Your own booking page with live free slots',
        'Opening hours and slot length you control',
        'Week and day calendar, coloured by service',
        'A warning before you double-book',
        'Clients can add the visit to their phone calendar',
        'Mark seen, no-show or cancelled in one tap'
      ]
    },
    {
      title: 'People and notes', icon: 'users', color: '#6D5DF6',
      items: [
        'Full visit-by-visit history, searchable',
        'Last visit\'s notes shown when they arrive',
        'Upload prescriptions, reports and photos to any visit',
        'Call, WhatsApp or email in one tap',
        'Ready-written WhatsApp reminders',
        'Book the follow-up in one tap'
      ]
    },
    {
      title: 'Money', icon: 'wallet', color: '#B8740A',
      items: [
        'Invoice a visit in one click',
        'Tax, due dates and automatic numbering',
        'Print or save invoices as PDF',
        'Copy a payment message for WhatsApp',
        'Overdue amounts flagged for you',
        'Monthly income chart and no-show rate'
      ]
    },
    {
      title: 'Works your way', icon: 'sparkle', color: '#4C9A6A',
      items: [
        'Your words for people and visits',
        'Works on phone, tablet and laptop',
        'Nothing to install',
        'Each practice\'s data kept separate',
        'Passwords stored encrypted',
        'Sample data to try everything first'
      ]
    }
  ];
}
