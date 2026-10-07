import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../environments/environment';
import { ApiService } from '../core/services/api.service';
import { BusinessInfo } from '../core/models';

type Page = 'privacy' | 'terms' | 'refunds' | 'contact';

/**
 * Privacy, Terms, Refund and Contact pages. Razorpay reviews these before activating
 * payments. Fill in environment.legal and have the text reviewed by a lawyer.
 */
@Component({
  selector: 'app-legal',
  standalone: false,
  templateUrl: './legal.component.html',
  styleUrl: './legal.component.scss'
})
export class LegalComponent implements OnInit {
  readonly appName = environment.appName;
  readonly email = environment.contactEmail;
  readonly legal = environment.legal;
  biz: BusinessInfo = { name: 'Xelvo Technologies', address: '…', phone: '', email: environment.contactEmail, gstin: null, jurisdictionCity: null, grievanceOfficer: null };
  readonly year = new Date().getFullYear();
  page: Page = 'privacy';
  /** State from the first two digits of the GSTIN (09 = Uttar Pradesh). */
  stateOf(gstin: string | null): string {
    const states: Record<string, string> = { '07': 'Delhi', '09': 'Uttar Pradesh', '06': 'Haryana', '27': 'Maharashtra', '29': 'Karnataka', '33': 'Tamil Nadu', '36': 'Telangana', '19': 'West Bengal', '24': 'Gujarat', '08': 'Rajasthan' };
    return (gstin && states[gstin.slice(0, 2)]) || 'India';
  }

  get tel(): string { return 'tel:' + (this.biz.phone ?? '').replace(/[^+0-9]/g, ''); }

  readonly titles: Record<Page, string> = {
    privacy: 'Privacy policy',
    terms: 'Terms of service',
    refunds: 'Refunds, cancellation and delivery',
    contact: 'Contact us'
  };

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit(): void {
    this.route.data.subscribe(d => this.page = (d['page'] as Page) ?? 'privacy');
    this.api.business().subscribe({ next: b => this.biz = b, error: () => {} });
  }
}
