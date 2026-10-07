import { Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthService } from '../core/services/auth.service';
import { ToastService } from '../core/services/toast.service';
import { errorMessage } from '../core/utils/errors';

/**
 * "Check your email": type the 6-digit code, or arrive here from the email link (?token=…).
 */
@Component({
  selector: 'app-verify-email',
  standalone: false,
  templateUrl: './verify-email.component.html',
  styleUrls: ['./auth.scss', './verify-email.component.scss']
})
export class VerifyEmailComponent implements OnInit, OnDestroy {
  @ViewChildren('box') boxes!: QueryList<ElementRef<HTMLInputElement>>;

  readonly appName = environment.appName;
  digits = ['', '', '', '', '', ''];
  email = '';
  mode: 'code' | 'link' | 'missing' = 'code';
  verifying = false;
  error = '';
  shake = false;
  done = false;
  cooldown = 0;
  private timer?: ReturnType<typeof setInterval>;

  constructor(private auth: AuthService, private route: ActivatedRoute, private router: Router, private toast: ToastService) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.mode = 'link';
      this.verifying = true;
      this.auth.verifyLink(token).subscribe({
        next: () => this.success(),
        error: err => { this.verifying = false; this.error = errorMessage(err); }
      });
      return;
    }
    const pending = this.auth.pending;
    if (!pending) { this.mode = 'missing'; return; }
    this.email = pending.email;
    this.startCooldown(45);
    setTimeout(() => this.focus(0), 300);
  }

  ngOnDestroy(): void { clearInterval(this.timer); }

  get code(): string { return this.digits.join(''); }

  onInput(i: number, e: Event): void {
    const input = e.target as HTMLInputElement;
    const v = input.value.replace(/\D/g, '');
    if (v.length > 1) { this.fill(v, i); return; }
    this.digits[i] = v;
    input.value = v;
    this.error = '';
    if (v && i < 5) this.focus(i + 1);
    if (this.code.length === 6) this.verify();
  }

  onKey(i: number, e: KeyboardEvent): void {
    if (e.key === 'Backspace' && !this.digits[i] && i > 0) { this.digits[i - 1] = ''; this.focus(i - 1); e.preventDefault(); }
    if (e.key === 'ArrowLeft' && i > 0) this.focus(i - 1);
    if (e.key === 'ArrowRight' && i < 5) this.focus(i + 1);
  }

  onPaste(e: ClipboardEvent): void {
    const text = (e.clipboardData?.getData('text') ?? '').replace(/\D/g, '');
    if (text) { e.preventDefault(); this.fill(text, 0); }
  }

  private fill(text: string, from: number): void {
    for (let k = 0; k < 6 - from; k++) this.digits[from + k] = text[k] ?? this.digits[from + k];
    this.boxes.forEach((b, idx) => b.nativeElement.value = this.digits[idx]);
    this.focus(Math.min(5, from + text.length));
    if (this.code.length === 6) this.verify();
  }

  private focus(i: number): void {
    const el = this.boxes?.get(i)?.nativeElement;
    el?.focus();
    el?.select();
  }

  verify(): void {
    if (this.code.length !== 6 || this.verifying) return;
    this.verifying = true;
    this.error = '';
    this.auth.verifyEmail(this.code).subscribe({
      next: () => this.success(),
      error: err => {
        this.verifying = false;
        this.error = errorMessage(err, 'That code isn\'t right.');
        this.shake = true;
        setTimeout(() => this.shake = false, 500);
        this.digits = ['', '', '', '', '', ''];
        this.boxes.forEach(b => b.nativeElement.value = '');
        setTimeout(() => this.focus(0), 50);
      }
    });
  }

  resend(): void {
    if (this.cooldown > 0) return;
    this.auth.resendVerification().subscribe({
      next: r => { this.toast.success(r.message); this.startCooldown(60); },
      error: err => this.toast.error(errorMessage(err))
    });
  }

  startOver(): void {
    this.auth.clearPending();
    this.router.navigate(['/register']);
  }

  private success(): void {
    this.done = true;
    this.verifying = false;
    setTimeout(() => {
      this.toast.success(`Email confirmed. Welcome to ${this.appName}!`);
      this.router.navigate(['/app']);
    }, 1100);
  }

  private startCooldown(seconds: number): void {
    clearInterval(this.timer);
    this.cooldown = seconds;
    this.timer = setInterval(() => { this.cooldown--; if (this.cooldown <= 0) clearInterval(this.timer); }, 1000);
  }
}
