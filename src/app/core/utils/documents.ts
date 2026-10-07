import { ClientDocument } from '../models';

export const MAX_UPLOAD_MB = 15;
const ALLOWED = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'];

/** What the file picker accepts. Includes image/* so phones offer the camera. */
export const ACCEPT = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.heic,.heif';

export function fileProblem(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED.includes(ext)) return `${file.name}: upload a PDF, photo, Word, Excel or text file.`;
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return `${file.name} is larger than ${MAX_UPLOAD_MB} MB.`;
  return null;
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type DocKind = 'image' | 'pdf' | 'file';

export function docKind(doc: Pick<ClientDocument, 'contentType'>): DocKind {
  if (doc.contentType === 'application/pdf') return 'pdf';
  if (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(doc.contentType)) return 'image';
  return 'file';
}

/** Examples of what to upload, in the language of each profession. */
export function documentHint(profession: string | undefined): string {
  switch (profession) {
    case 'DOCTOR': return 'Prescriptions, lab reports, scans';
    case 'DENTIST': return 'X-rays, prescriptions, treatment plans';
    case 'PHYSIOTHERAPIST': return 'Prescriptions, scans, exercise plans';
    case 'PSYCHOLOGIST': return 'Assessments, consent forms, worksheets';
    case 'LAWYER': return 'Contracts, notices, case papers';
    case 'ACCOUNTANT': return 'Returns, statements, receipts';
    case 'TUTOR': return 'Worksheets, test papers, progress reports';
    case 'SALON': return 'Before and after photos, patch tests';
    default: return 'Documents, photos, reports';
  }
}
