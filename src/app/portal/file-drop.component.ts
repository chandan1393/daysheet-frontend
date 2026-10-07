import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { ToastService } from '../core/services/toast.service';
import { ACCEPT, MAX_UPLOAD_MB, fileProblem } from '../core/utils/documents';

/**
 * Drop files here or pick them. On phones the picker offers the camera,
 * so a paper prescription can be photographed straight onto the record.
 */
@Component({
  selector: 'app-file-drop',
  standalone: false,
  template: `
    <input #picker type="file" multiple [accept]="accept" class="sr-only" (change)="onPick($event)" tabindex="-1">
    @if (compact) {
      <button type="button" class="btn btn-sm" (click)="picker.click()"><app-icon name="paperclip" [size]="15" />{{ label }}</button>
    } @else {
      <div class="zone" [class.over]="over" (click)="picker.click()" (keydown.enter)="picker.click()" tabindex="0" role="button"
           (dragover)="onDragOver($event)" (dragleave)="over = false" (drop)="onDrop($event)">
        <span class="zi"><app-icon name="upload" [size]="20" /></span>
        <span class="zt"><strong>{{ label }}</strong> or drop files here</span>
        <span class="zh">{{ hint }}. PDF, photos, Word or Excel, up to {{ maxMb }} MB.</span>
      </div>
    }`,
  styles: [`
    :host { display: block; }
    :host(.inline) { display: inline-block; }
    .zone {
      display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; cursor: pointer;
      padding: 18px; border: 2px dashed var(--line-strong); border-radius: 16px; background: var(--paper);
      transition: border-color .2s, background-color .2s, transform .25s var(--ease-spring);
    }
    .zone:hover { border-color: var(--lagoon); }
    .zone.over { border-color: var(--lagoon); background: var(--lagoon-wash); transform: scale(1.015); }
    .zi { width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; background: var(--surface); color: var(--lagoon); box-shadow: var(--shadow-1); margin-bottom: 4px; transition: transform .3s var(--ease-spring); }
    .zone.over .zi { transform: translateY(-4px); }
    .zt { font-size: 14px; color: var(--muted); }
    .zt strong { color: var(--lagoon-deep); }
    .zh { font-size: 12px; color: var(--faint); }
  `]
})
export class FileDropComponent {
  @Input() compact = false;
  @Input() label = 'Take a photo or choose files';
  @Input() hint = 'Documents, photos, reports';
  @Output() files = new EventEmitter<File[]>();
  @ViewChild('picker') picker?: ElementRef<HTMLInputElement>;

  readonly accept = ACCEPT;
  readonly maxMb = MAX_UPLOAD_MB;
  over = false;

  constructor(private toast: ToastService) {}

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.over = true;
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.over = false;
    this.emit(Array.from(e.dataTransfer?.files ?? []));
  }

  onPick(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.emit(Array.from(input.files ?? []));
    input.value = '';
  }

  private emit(list: File[]): void {
    const ok: File[] = [];
    for (const f of list) {
      const problem = fileProblem(f);
      if (problem) this.toast.error(problem); else ok.push(f);
    }
    if (ok.length) this.files.emit(ok);
  }
}
