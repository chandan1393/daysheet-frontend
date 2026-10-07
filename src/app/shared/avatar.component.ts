import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { avatarColors } from '../core/utils/color';

@Component({
  selector: 'app-avatar',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span [style.background]="colors.bg" [style.color]="colors.fg"
                   [style.width.px]="size" [style.height.px]="size" [style.font-size.px]="size * 0.38">{{ initials }}</span>`,
  styles: [`
    :host { display: inline-flex; flex-shrink: 0; }
    span { display: grid; place-items: center; border-radius: 32%; font-weight: 700; font-family: var(--font-display); letter-spacing: .01em; }
  `]
})
export class AvatarComponent {
  @Input() name = '';
  @Input() size = 36;

  get colors() { return avatarColors(this.name || '?'); }

  get initials(): string {
    const parts = (this.name || '?').trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  }
}
