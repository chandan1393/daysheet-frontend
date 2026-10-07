import { Component, OnDestroy, OnInit } from '@angular/core';
import { animate, group, query, stagger, style, transition, trigger } from '@angular/animations';
import { environment } from '../../environments/environment';
import { AuthService } from '../core/services/auth.service';
import { ApiService } from '../core/services/api.service';
import { BusinessInfo, PricePlan } from '../core/models';

interface DemoBlock { time: string; name: string; service: string; color: string; minutes: number; }
interface Demo {
  key: string; label: string; place: string; people: string; visits: string;
  blocks: DemoBlock[]; nowAfter: number; billed: string;
}

const C = { lagoon: '#0E7C86', iris: '#6D5DF6', rose: '#E5487A', marigold: '#F2A20C', sage: '#4C9A6A', sky: '#3A86FF' };

const DEMOS: Demo[] = [
  {
    key: 'physio', label: 'Physiotherapist', place: 'clinic', people: 'patients', visits: 'sessions', nowAfter: 2, billed: '₹6,400',
    blocks: [
      { time: '09:00', name: 'Aarav Mehta', service: 'Initial assessment', color: C.lagoon, minutes: 60 },
      { time: '10:30', name: 'Emma Lawson', service: 'Treatment session', color: C.iris, minutes: 45 },
      { time: '12:00', name: 'Rohan Iyer', service: 'Sports massage', color: C.rose, minutes: 30 },
      { time: '15:00', name: 'Maya Fernandes', service: 'Treatment session', color: C.iris, minutes: 45 }
    ]
  },
  {
    key: 'lawyer', label: 'Lawyer', place: 'chambers', people: 'clients', visits: 'consultations', nowAfter: 1, billed: '₹18,000',
    blocks: [
      { time: '10:00', name: 'Priya Nair', service: 'Initial consultation', color: C.lagoon, minutes: 30 },
      { time: '11:30', name: 'Lucas Brennan', service: 'Case review', color: C.iris, minutes: 60 },
      { time: '14:00', name: 'Sara Kapoor', service: 'Document drafting', color: C.marigold, minutes: 90 },
      { time: '16:30', name: 'Noah Williams', service: 'Initial consultation', color: C.lagoon, minutes: 30 }
    ]
  },
  {
    key: 'doctor', label: 'Doctor', place: 'clinic', people: 'patients', visits: 'consultations', nowAfter: 3, billed: '₹4,200',
    blocks: [
      { time: '09:00', name: 'Daniel Osei', service: 'General consultation', color: C.lagoon, minutes: 15 },
      { time: '09:30', name: 'Ananya Rao', service: 'Follow-up visit', color: C.sage, minutes: 10 },
      { time: '10:00', name: 'Ishaan Verma', service: 'Health check-up', color: C.iris, minutes: 30 },
      { time: '11:15', name: 'Grace Mensah', service: 'General consultation', color: C.lagoon, minutes: 15 }
    ]
  },
  {
    key: 'tutor', label: 'Tutor', place: 'classes', people: 'students', visits: 'lessons', nowAfter: 1, billed: '₹2,700',
    blocks: [
      { time: '15:00', name: 'Kabir Shah', service: 'One-to-one lesson', color: C.iris, minutes: 60 },
      { time: '16:15', name: 'Lily Chen', service: 'Exam preparation', color: C.marigold, minutes: 90 },
      { time: '18:00', name: 'Arjun Pillai', service: 'Trial lesson', color: C.sage, minutes: 30 },
      { time: '19:00', name: 'Zara Ahmed', service: 'One-to-one lesson', color: C.iris, minutes: 60 }
    ]
  },
  {
    key: 'salon', label: 'Salon', place: 'salon', people: 'clients', visits: 'appointments', nowAfter: 2, billed: '₹5,200',
    blocks: [
      { time: '10:00', name: 'Hannah Clarke', service: 'Haircut', color: C.rose, minutes: 45 },
      { time: '11:00', name: 'Meera Joshi', service: 'Colour', color: C.iris, minutes: 120 },
      { time: '13:30', name: 'Olivia Reid', service: 'Facial', color: C.lagoon, minutes: 60 },
      { time: '15:00', name: 'Tara Singh', service: 'Haircut', color: C.rose, minutes: 45 }
    ]
  },
  {
    key: 'coach', label: 'Consultant', place: 'business', people: 'clients', visits: 'sessions', nowAfter: 1, billed: '₹16,500',
    blocks: [
      { time: '09:30', name: 'Ethan Brooks', service: 'Discovery call', color: C.sage, minutes: 30 },
      { time: '11:00', name: 'Nisha Menon', service: 'Coaching session', color: C.iris, minutes: 60 },
      { time: '14:00', name: 'Lumen Studio', service: 'Strategy workshop', color: C.lagoon, minutes: 120 },
      { time: '17:00', name: 'Omar Haddad', service: 'Coaching session', color: C.iris, minutes: 60 }
    ]
  }
];

@Component({
  selector: 'app-landing',
  standalone: false,
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  animations: [
    trigger('dayMorph', [
      transition('* => *', [
        query(':enter .row', style({ opacity: 0, transform: 'translateX(18px)' }), { optional: true }),
        group([
          query(':leave .row', [
            stagger(40, animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(-14px)' })))
          ], { optional: true }),
          query(':enter .row', [
            stagger(70, animate('420ms 160ms cubic-bezier(.2,.8,.2,1)', style({ opacity: 1, transform: 'none' })))
          ], { optional: true })
        ])
      ])
    ]),
    trigger('wordRoll', [
      transition('* => *', [
        query(':leave', [
          style({ position: 'absolute' }),
          animate('220ms ease-in', style({ opacity: 0, transform: 'translateY(-60%)' }))
        ], { optional: true }),
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(60%)' }),
          animate('420ms 60ms cubic-bezier(.2,.8,.2,1)', style({ opacity: 1, transform: 'none' }))
        ], { optional: true })
      ])
    ])
  ]
})
export class LandingComponent implements OnInit, OnDestroy {
  readonly appName = environment.appName;
  readonly contactEmail = environment.contactEmail;
  readonly footerProfessions = ['Doctors', 'Physiotherapists', 'Dentists', 'Therapists', 'Lawyers', 'Accountants', 'Tutors', 'Salons'];
  readonly year = new Date().getFullYear();
  readonly demos = DEMOS;
  active = DEMOS[0];
  dayLabel = new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });

  plans: PricePlan[] = [];
  biz: BusinessInfo | null = null;

  // Interactive mini demos in the "how it works" section
  readonly bookingDays = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return { day: d.toLocaleDateString([], { weekday: 'short' }), date: d.getDate() };
  });
  readonly bookingSlots = ['09:30', '10:15', '11:00', '14:30', '16:00', '17:15'];
  pickedDay = 1;
  pickedSlot = '11:00';
  invoicePaid = false;

  readonly professionsTable = [
    ['Doctor', 'Patients', 'Consultations'],
    ['Physiotherapist', 'Patients', 'Sessions'],
    ['Dentist', 'Patients', 'Appointments'],
    ['Psychologist or therapist', 'Clients', 'Sessions'],
    ['Lawyer', 'Clients', 'Consultations'],
    ['Accountant or CA', 'Clients', 'Meetings'],
    ['Tutor or trainer', 'Students', 'Lessons'],
    ['Salon or beauty', 'Clients', 'Appointments']
  ];

  readonly faqs = [
    { q: 'Do my clients need to create an account?', a: 'No. They open your booking link, pick a service and a time, and leave their name and phone number. The appointment appears in your calendar straight away.' },
    { q: 'Can I use it if I already keep a paper diary?', a: 'Yes. Most people start by adding this week\'s appointments by hand, then share the booking link so new bookings come in on their own.' },
    { q: 'Who can see my client notes?', a: 'Only people who log in to your practice. Notes, appointments and invoices are kept separate for every practice.' },
    { q: 'Does it work on my phone?', a: 'Yes. Daysheet runs in the browser on any phone, tablet or laptop, so there is nothing to install. Your booking page is built for clients booking from their phones.' },
    { q: 'Can I bring my existing client list?', a: 'Yes. Add people as they come in, or on the yearly plan send us your list and we will set it up for you.' },
    { q: 'Can I change the words and services later?', a: 'Any time. Rename "Patient" to "Client", "Session" to "Consultation", and add or edit services with their own length, price and colour.' },
    { q: 'How do I pay after the free trial?', a: 'Choose monthly or yearly inside the app and pay with UPI, card or net banking through Razorpay. Prefer a bank transfer? Email us and we will set it up.' },
    { q: 'What happens if I don\'t pay?', a: 'Nothing is deleted. You can still open every record, but new bookings and changes pause until you choose a plan.' }
  ];

  private timer?: ReturnType<typeof setInterval>;
  private userPicked = false;

  constructor(public auth: AuthService, private api: ApiService) {}

  ngOnInit(): void {
    this.api.plans().subscribe({ next: p => this.plans = p, error: () => this.plans = [] });
    this.api.business().subscribe({ next: b => this.biz = b, error: () => this.biz = null });
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.timer = setInterval(() => {
        if (this.userPicked) return;
        const i = DEMOS.indexOf(this.active);
        this.active = DEMOS[(i + 1) % DEMOS.length];
      }, 4200);
    }
  }

  ngOnDestroy(): void { clearInterval(this.timer); }

  pick(demo: Demo): void {
    this.userPicked = true;
    this.active = demo;
  }

  /** Monthly price in rupees, for the no-show calculator. */
  get monthlyRupees(): number {
    const monthly = [...this.plans].sort((a, b) => a.durationDays - b.durationDays)[0];
    return monthly ? monthly.totalPaise / 100 : 799;
  }

  get gstNote(): string {
    const p = this.plans[0];
    if (!p || !p.gstRate) return '';
    return p.taxIncluded ? `Prices include ${p.gstRate}% GST.` : `${p.gstRate}% GST is added at checkout.`;
  }

  rupees(paise: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100);
  }


}
