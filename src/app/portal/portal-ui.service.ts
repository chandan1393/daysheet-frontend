import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Appointment, ClientDocument, InvoiceDetail, Prescription } from '../core/models';

export interface NewAppointmentPrefill {
  start?: Date;
  clientId?: number;
  clientName?: string;
  serviceId?: number | null;
}

export interface PrescriptionRequestUi {
  clientId: number;
  clientName: string;
  appointmentId: number | null;
  /** Edit this one. */
  prescription?: Prescription;
  /** Start from a copy of this one ("repeat last prescription"). */
  repeatFrom?: Prescription;
}

export interface InvoiceFormRequest {
  invoice?: InvoiceDetail;
  clientId?: number;
}

/**
 * The shell owns the appointment and invoice dialogs; pages ask for them here
 * and listen to changed$ to refresh their own data afterwards.
 */
@Injectable()
export class PortalUiService {
  readonly newAppointment$ = new Subject<NewAppointmentPrefill>();
  readonly editAppointment$ = new Subject<Appointment>();
  readonly showAppointment$ = new Subject<Appointment>();
  readonly showInvoice$ = new Subject<number>();
  readonly invoiceForm$ = new Subject<InvoiceFormRequest>();
  readonly showDocument$ = new Subject<ClientDocument>();
  readonly writePrescription$ = new Subject<PrescriptionRequestUi>();
  readonly showPrescription$ = new Subject<Prescription>();
  readonly changed$ = new Subject<void>();

  newAppointment(prefill: NewAppointmentPrefill = {}): void { this.newAppointment$.next(prefill); }
  editAppointment(a: Appointment): void { this.editAppointment$.next(a); }
  showAppointment(a: Appointment): void { this.showAppointment$.next(a); }
  showInvoice(id: number): void { this.showInvoice$.next(id); }
  openInvoiceForm(req: InvoiceFormRequest = {}): void { this.invoiceForm$.next(req); }
  showDocument(doc: ClientDocument): void { this.showDocument$.next(doc); }
  writePrescription(req: PrescriptionRequestUi): void { this.writePrescription$.next(req); }
  showPrescription(p: Prescription): void { this.showPrescription$.next(p); }
  notifyChanged(): void { this.changed$.next(); }
}
