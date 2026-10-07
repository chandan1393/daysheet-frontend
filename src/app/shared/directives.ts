import { Directive, ElementRef, HostListener, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Material-style ink ripple from the click point. Add appRipple to any .btn */
@Directive({ selector: '[appRipple]', standalone: false })
export class RippleDirective {
  constructor(private el: ElementRef<HTMLElement>) {}

  @HostListener('pointerdown', ['$event'])
  onDown(e: PointerEvent): void {
    if (reducedMotion()) return;
    const host = this.el.nativeElement;
    const rect = host.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ink = document.createElement('span');
    ink.className = 'ripple';
    ink.style.width = ink.style.height = `${size}px`;
    ink.style.left = `${e.clientX - rect.left - size / 2}px`;
    ink.style.top = `${e.clientY - rect.top - size / 2}px`;
    host.appendChild(ink);
    setTimeout(() => ink.remove(), 600);
  }
}

/**
 * Counts a number up from its previous value.
 * <span [appCountUp]="total" [format]="fmt"></span>
 */
@Directive({ selector: '[appCountUp]', standalone: false })
export class CountUpDirective implements OnChanges, OnDestroy {
  @Input('appCountUp') value = 0;
  @Input() format: (n: number) => string = n => Math.round(n).toLocaleString();
  @Input() duration = 900;

  private current = 0;
  private frame = 0;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnChanges(): void {
    cancelAnimationFrame(this.frame);
    const from = this.current;
    const to = Number(this.value) || 0;
    if (reducedMotion() || from === to) {
      this.render(to);
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / this.duration);
      const eased = 1 - Math.pow(1 - t, 4);
      this.render(from + (to - from) * eased);
      if (t < 1) this.frame = requestAnimationFrame(step);
    };
    this.frame = requestAnimationFrame(step);
  }

  ngOnDestroy(): void { cancelAnimationFrame(this.frame); }

  private render(n: number): void {
    this.current = n;
    this.el.nativeElement.textContent = this.format(n);
  }
}

/**
 * Positions a sliding marker under the active button of a .seg control.
 * <div class="seg" [appSegMarker]="activeIndex"> ... <span class="marker"></span></div>
 */
@Directive({ selector: '[appSegMarker]', standalone: false })
export class SegMarkerDirective implements OnChanges {
  @Input('appSegMarker') active: unknown;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnChanges(): void { requestAnimationFrame(() => this.place()); }

  @HostListener('window:resize')
  place(): void {
    const host = this.el.nativeElement;
    const marker = host.querySelector<HTMLElement>('.marker');
    const on = host.querySelector<HTMLElement>('button.on');
    if (!marker || !on) return;
    marker.style.width = `${on.offsetWidth}px`;
    marker.style.transform = `translateX(${on.offsetLeft}px)`;
  }
}

/**
 * Fades and lifts an element into view the first time it scrolls on screen.
 * <div appReveal [revealDelay]="120">...</div>
 */
@Directive({ selector: '[appReveal]', standalone: false })
export class RevealDirective implements OnInit, OnDestroy {
  @Input() revealDelay = 0;
  private observer?: IntersectionObserver;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    const node = this.el.nativeElement;
    if (reducedMotion() || typeof IntersectionObserver === 'undefined') return;
    node.classList.add('reveal');
    node.style.transitionDelay = `${this.revealDelay}ms`;
    this.observer = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) {
        node.classList.add('in');
        this.observer?.disconnect();
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    this.observer.observe(node);
  }

  ngOnDestroy(): void { this.observer?.disconnect(); }
}
