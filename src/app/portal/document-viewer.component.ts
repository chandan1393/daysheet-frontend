import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../core/services/api.service';
import { ConfirmService } from '../core/services/confirm.service';
import { ToastService } from '../core/services/toast.service';
import { ClientDocument } from '../core/models';
import { DocKind, docKind, formatSize } from '../core/utils/documents';
import { errorMessage } from '../core/utils/errors';

/** Previews photos and PDFs in the app; other files download. */
@Component({
  selector: 'app-document-viewer',
  standalone: false,
  template: `
    <div class="bar">
      <div class="info">
        <strong>{{ doc.fileName }}</strong>
        <span>{{ size }}, added {{ added }}@if (doc.uploadedBy) { by {{ doc.uploadedBy }} }</span>
      </div>
      <button class="btn btn-ghost btn-sm btn-danger" (click)="remove()" [disabled]="busy"><app-icon name="trash" [size]="15" />Delete</button>
      @if (url) {
        <a class="btn btn-sm" [href]="url" [attr.download]="doc.fileName"><app-icon name="download" [size]="15" />Download</a>
      }
    </div>

    <div class="stage" [class.dark]="kind === 'image'">
      @if (error) {
        <p class="msg">{{ error }}</p>
      } @else if (!url) {
        <span class="spinner"></span>
      } @else if (kind === 'image') {
        <img [src]="url" [alt]="doc.fileName">
      } @else if (kind === 'pdf' && frameUrl) {
        <iframe [src]="frameUrl" [title]="doc.fileName"></iframe>
      } @else {
        <div class="msg">
          <app-icon name="note" [size]="32" />
          <p>This file can't be previewed here.</p>
          <a class="btn btn-primary" [href]="url" [attr.download]="doc.fileName">Download {{ doc.fileName }}</a>
        </div>
      }
    </div>`,
  styles: [`
    .bar { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
    .info { flex: 1; min-width: 200px; display: flex; flex-direction: column; }
    .info strong { color: var(--ink); word-break: break-all; }
    .info span { font-size: 13px; color: var(--muted); }
    .stage { min-height: 300px; border-radius: 14px; background: var(--paper); display: grid; place-items: center; overflow: hidden; color: var(--muted); }
    .stage.dark { background: #0B1628; }
    img { max-width: 100%; max-height: 72vh; display: block; animation: zoom .35s var(--ease-out); }
    iframe { width: 100%; height: 72vh; border: 0; background: #fff; }
    .msg { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 40px; text-align: center; }
    @keyframes zoom { from { opacity: 0; transform: scale(.97); } }
  `]
})
export class DocumentViewerComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) doc!: ClientDocument;
  @Output() deleted = new EventEmitter<void>();

  url: string | null = null;
  frameUrl: SafeResourceUrl | null = null;
  error = '';
  busy = false;

  constructor(private api: ApiService, private sanitizer: DomSanitizer, private confirm: ConfirmService, private toast: ToastService) {}

  get kind(): DocKind { return docKind(this.doc); }
  get size(): string { return formatSize(this.doc.sizeBytes); }
  get added(): string {
    return new Date(this.doc.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  }

  ngOnChanges(): void {
    this.release();
    this.error = '';
    this.api.documentBlob(this.doc.id).subscribe({
      next: blob => {
        this.url = URL.createObjectURL(blob);
        if (this.kind === 'pdf') this.frameUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
      },
      error: err => this.error = errorMessage(err, 'Could not open this file.')
    });
  }

  ngOnDestroy(): void { this.release(); }

  async remove(): Promise<void> {
    const ok = await this.confirm.ask('Delete this file?', `${this.doc.fileName} will be removed from the record permanently.`, 'Delete file');
    if (!ok) return;
    this.busy = true;
    this.api.deleteDocument(this.doc.id).subscribe({
      next: () => { this.busy = false; this.toast.success('File deleted.'); this.deleted.emit(); },
      error: err => { this.busy = false; this.toast.error(errorMessage(err)); }
    });
  }

  private release(): void {
    if (this.url) URL.revokeObjectURL(this.url);
    this.url = null;
    this.frameUrl = null;
  }
}
