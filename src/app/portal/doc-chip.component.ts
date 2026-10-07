import { Component, Input } from '@angular/core';
import { ClientDocument } from '../core/models';
import { docKind, formatSize } from '../core/utils/documents';
import { PortalUiService } from './portal-ui.service';

/** A file on someone's record. Click to preview it. */
@Component({
  selector: 'app-doc-chip',
  standalone: false,
  template: `
    <button type="button" class="chip-doc" [class]="kind" (click)="ui.showDocument(doc)" [title]="doc.fileName">
      <span class="ic"><app-icon [name]="kind === 'image' ? 'image' : 'note'" [size]="16" /></span>
      <span class="meta">
        <span class="name">{{ doc.fileName }}</span>
        <span class="sub">{{ kindLabel }}, {{ size }}</span>
      </span>
    </button>`,
  styles: [`
    :host { display: inline-flex; max-width: 100%; }
    .chip-doc {
      --c: var(--sky);
      display: inline-flex; align-items: center; gap: 10px; max-width: 100%; padding: 7px 12px 7px 7px; border-radius: 12px;
      border: 1px solid var(--line-strong); background: var(--surface); cursor: pointer; text-align: left;
      transition: border-color .2s, transform .2s var(--ease-out), box-shadow .2s;
    }
    .chip-doc:hover { border-color: var(--c); transform: translateY(-1px); box-shadow: var(--shadow-1); }
    .pdf { --c: var(--rose); }
    .image { --c: var(--iris); }
    .ic { width: 32px; height: 32px; border-radius: 9px; display: grid; place-items: center; flex-shrink: 0;
          color: var(--c); background: color-mix(in srgb, var(--c) 12%, #fff); }
    .meta { display: flex; flex-direction: column; min-width: 0; }
    .name { font-size: 13px; font-weight: 600; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px; }
    .sub { font-size: 11.5px; color: var(--muted); }
  `]
})
export class DocChipComponent {
  @Input({ required: true }) doc!: ClientDocument;

  constructor(public ui: PortalUiService) {}

  get kind() { return docKind(this.doc); }
  get kindLabel(): string { return this.kind === 'pdf' ? 'PDF' : this.kind === 'image' ? 'Photo' : (this.doc.fileName.split('.').pop() ?? 'File').toUpperCase(); }
  get size(): string { return formatSize(this.doc.sizeBytes); }
}
