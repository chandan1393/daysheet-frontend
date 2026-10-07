import { Injectable, NgZone } from '@angular/core';
import { Checkout } from '../models';

export interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window { Razorpay?: new (options: Record<string, unknown>) => { open(): void; on(event: string, cb: (r: { error?: { description?: string } }) => void): void }; }
}

const SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

/** Loads Razorpay Checkout only when someone actually pays, then opens it for an order made on the server. */
@Injectable({ providedIn: 'root' })
export class RazorpayService {
  private loading?: Promise<void>;

  constructor(private zone: NgZone) {}

  private load(): Promise<void> {
    if (window.Razorpay) return Promise.resolve();
    this.loading ??= new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = SCRIPT;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => { this.loading = undefined; reject(new Error('Could not load Razorpay. Check your connection.')); };
      document.body.appendChild(s);
    });
    return this.loading;
  }

  /** Resolves with the signed result, or rejects if the payment fails or the window is closed. */
  async pay(c: Checkout, themeColor = '#0E7C86'): Promise<RazorpaySuccess> {
    await this.load();
    const Razorpay = window.Razorpay;
    if (!Razorpay) throw new Error('Razorpay is unavailable.');
    return new Promise<RazorpaySuccess>((resolve, reject) => {
      const rzp = new Razorpay({
        key: c.keyId,
        amount: c.amountPaise,
        currency: c.currency,
        name: c.businessName,
        description: c.description,
        order_id: c.orderId,
        prefill: { name: c.prefillName, email: c.prefillEmail, contact: c.prefillContact },
        theme: { color: themeColor },
        handler: (r: RazorpaySuccess) => this.zone.run(() => resolve(r)),
        modal: { ondismiss: () => this.zone.run(() => reject(new Error('dismissed'))) }
      });
      rzp.on('payment.failed', r => this.zone.run(() => reject(new Error(r.error?.description || 'The payment failed.'))));
      rzp.open();
    });
  }
}
