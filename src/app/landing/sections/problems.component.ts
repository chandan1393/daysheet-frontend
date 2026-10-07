import { Component } from '@angular/core';

interface Problem { icon: string; problem: string; problemText: string; fix: string; fixText: string; }

/** "Sound familiar?" — four everyday pains that flip over to show how Daysheet handles them. */
@Component({
  selector: 'app-landing-problems',
  standalone: false,
  templateUrl: './problems.component.html',
  styleUrl: './problems.component.scss'
})
export class LandingProblemsComponent {
  readonly items: Problem[] = [
    {
      icon: 'phone',
      problem: 'The phone rings mid-session',
      problemText: 'Every booking is a call you take between appointments, or a message you answer at midnight.',
      fix: 'Clients book themselves',
      fixText: 'Your link shows only your free slots, so bookings come in while you work.'
    },
    {
      icon: 'clock',
      problem: 'Empty slots from no-shows',
      problemText: 'Someone forgets, the hour sits empty and nobody pays for it.',
      fix: 'Reminders in one tap',
      fixText: 'Send a ready-written WhatsApp reminder from any appointment, and track your no-show rate on the dashboard.'
    },
    {
      icon: 'note',
      problem: 'Notes in three places',
      problemText: 'A diary, a notebook and photos on your phone. On the tenth visit, nobody remembers the first.',
      fix: 'One page per person',
      fixText: 'Every visit with its notes and files, numbered and searchable. Last time\'s notes open with today\'s appointment.'
    },
    {
      icon: 'wallet',
      problem: 'Chasing who still owes you',
      problemText: 'Cash, UPI and bank transfers, with no clear list of what is still pending.',
      fix: 'Money you can see',
      fixText: 'Bill a visit in one click, mark it paid, and see every overdue amount on your dashboard.'
    }
  ];

  flipped = this.items.map(() => false);
  private batch = false;

  get allFixed(): boolean { return this.flipped.every(Boolean); }

  setAll(value: boolean): void {
    this.batch = true;
    this.flipped = this.flipped.map(() => value);
  }

  toggle(i: number): void {
    this.batch = false;
    this.flipped = this.flipped.map((v, idx) => idx === i ? !v : v);
  }

  delay(i: number): number { return this.batch ? i * 110 : 0; }
}
