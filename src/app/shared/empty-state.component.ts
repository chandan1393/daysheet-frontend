import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: false,
  template: `
    <div class="empty">
      <span class="icon"><app-icon [name]="icon" [size]="22" /></span>
      <h3>{{ title }}</h3>
      @if (text) { <p>{{ text }}</p> }
      <div class="actions"><ng-content /></div>
    </div>`,
  styles: [`
    .empty { text-align: center; padding: 40px 20px; display: flex; flex-direction: column; align-items: center; }
    .icon { width: 52px; height: 52px; border-radius: 16px; display: grid; place-items: center; background: var(--lagoon-wash); color: var(--lagoon); margin-bottom: 14px; }
    h3 { font-size: 18px; }
    p { color: var(--muted); margin-top: 6px; max-width: 360px; }
    .actions:not(:empty) { margin-top: 18px; display: flex; gap: 10px; }
  `]
})
export class EmptyStateComponent {
  @Input() icon = 'sparkle';
  @Input() title = '';
  @Input() text = '';
}
