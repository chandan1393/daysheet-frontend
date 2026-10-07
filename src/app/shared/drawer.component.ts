import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-drawer',
  standalone: false,
  template: `
    @if (open) {
      <div class="backdrop" @backdrop (click)="closed.emit()"></div>
      <aside class="drawer" @slide role="dialog" aria-modal="true" [attr.aria-label]="title">
        <header>
          <div>
            <h2>{{ title }}</h2>
            @if (subtitle) { <p>{{ subtitle }}</p> }
          </div>
          <button class="btn btn-ghost btn-icon btn-sm" (click)="closed.emit()" aria-label="Close">
            <app-icon name="x" />
          </button>
        </header>
        <div class="body"><ng-content /></div>
        <footer><ng-content select="[drawer-footer]" /></footer>
      </aside>
    }`,
  styles: [`
    .backdrop { position: fixed; inset: 0; background: rgba(16, 33, 58, .35); z-index: 80; }
    .drawer {
      position: fixed; top: 0; right: 0; bottom: 0; width: min(480px, 100vw); z-index: 81;
      background: var(--surface); box-shadow: var(--shadow-3); display: flex; flex-direction: column;
    }
    header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding: 22px 24px 14px; border-bottom: 1px solid var(--line); }
    header h2 { font-size: 21px; }
    header p { color: var(--muted); font-size: 13.5px; margin-top: 2px; }
    .body { flex: 1; overflow-y: auto; padding: 20px 24px; }
    footer:not(:empty) { padding: 14px 24px; border-top: 1px solid var(--line); display: flex; gap: 10px; justify-content: flex-end; }
  `],
  animations: [
    trigger('backdrop', [
      transition(':enter', [style({ opacity: 0 }), animate('200ms', style({ opacity: 1 }))]),
      transition(':leave', [animate('200ms', style({ opacity: 0 }))])
    ]),
    trigger('slide', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('380ms cubic-bezier(.2,.9,.25,1)', style({ transform: 'none' }))
      ]),
      transition(':leave', [animate('240ms cubic-bezier(.5,0,.75,0)', style({ transform: 'translateX(100%)' }))])
    ])
  ]
})
export class DrawerComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() subtitle = '';
  @Output() closed = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void { if (this.open) this.closed.emit(); }
}
