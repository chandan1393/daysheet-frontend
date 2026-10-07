import { Component, EventEmitter, HostListener, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-modal',
  standalone: false,
  template: `
    @if (open) {
      <div class="backdrop" @backdrop (click)="close()" [style.z-index]="layer"></div>
      <div class="wrap" (click)="close()" [style.z-index]="layer + 1">
        <section class="dialog" @dialog [style.max-width]="width" role="dialog" aria-modal="true"
                 [attr.aria-label]="title" (click)="$event.stopPropagation()">
          @if (title) {
            <header>
              <h2>{{ title }}</h2>
              <button class="btn btn-ghost btn-icon btn-sm" (click)="close()" aria-label="Close">
                <app-icon name="x" />
              </button>
            </header>
          }
          <div class="body"><ng-content /></div>
        </section>
      </div>
    }`,
  styles: [`
    .backdrop { position: fixed; inset: 0; background: rgba(16, 33, 58, .42); backdrop-filter: blur(3px); z-index: 90; }
    .wrap { position: fixed; inset: 0; z-index: 91; display: grid; place-items: center; padding: 20px; overflow-y: auto; }
    .dialog {
      width: 100%; background: var(--surface); border-radius: var(--r-xl); box-shadow: var(--shadow-3);
      max-height: calc(100vh - 40px); display: flex; flex-direction: column;
    }
    header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 4px; }
    header h2 { font-size: 21px; }
    .body { padding: 16px 24px 24px; overflow-y: auto; }
    @media (max-width: 600px) {
      .wrap { align-items: end; padding: 0; }
      .dialog { border-radius: var(--r-xl) var(--r-xl) 0 0; max-height: 92vh; }
    }
  `],
  animations: [
    trigger('backdrop', [
      transition(':enter', [style({ opacity: 0 }), animate('200ms ease-out', style({ opacity: 1 }))]),
      transition(':leave', [animate('180ms ease-in', style({ opacity: 0 }))])
    ]),
    trigger('dialog', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px) scale(.97)' }),
        animate('320ms cubic-bezier(.34,1.3,.64,1)', style({ opacity: 1, transform: 'none' }))
      ]),
      transition(':leave', [animate('160ms ease-in', style({ opacity: 0, transform: 'translateY(10px) scale(.98)' }))])
    ])
  ]
})
export class ModalComponent implements OnChanges, OnDestroy {
  /** Open dialogs, oldest first, so a dialog opened on top of another closes first. */
  private static stack: ModalComponent[] = [];

  @Input() open = false;
  @Input() title = '';
  @Input() width = '560px';
  @Output() closed = new EventEmitter<void>();

  layer = 90;

  ngOnChanges(): void {
    const stack = ModalComponent.stack;
    const i = stack.indexOf(this);
    if (this.open && i < 0) stack.push(this);
    if (!this.open && i >= 0) stack.splice(i, 1);
    this.layer = 90 + Math.max(0, stack.indexOf(this)) * 4;
  }

  ngOnDestroy(): void {
    const i = ModalComponent.stack.indexOf(this);
    if (i >= 0) ModalComponent.stack.splice(i, 1);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    const stack = ModalComponent.stack;
    if (this.open && stack[stack.length - 1] === this) this.close();
  }

  close(): void { this.closed.emit(); }
}
