import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IconComponent } from './icon.component';
import { ModalComponent } from './modal.component';
import { DrawerComponent } from './drawer.component';
import { ToastHostComponent } from './toast-host.component';
import { ConfirmHostComponent } from './confirm-host.component';
import { AvatarComponent } from './avatar.component';
import { StatusPillComponent } from './status-pill.component';
import { EmptyStateComponent } from './empty-state.component';
import { TaxInvoiceComponent } from './tax-invoice.component';
import { DayLabelPipe, DurationPipe, MoneyPipe, TermPipe, TimePipe } from './pipes';
import { CountUpDirective, RevealDirective, RippleDirective, SegMarkerDirective } from './directives';

const DECLARATIONS = [
  IconComponent, ModalComponent, DrawerComponent, ToastHostComponent, ConfirmHostComponent,
  AvatarComponent, StatusPillComponent, EmptyStateComponent, TaxInvoiceComponent,
  MoneyPipe, TermPipe, TimePipe, DayLabelPipe, DurationPipe,
  RippleDirective, CountUpDirective, SegMarkerDirective, RevealDirective
];

@NgModule({
  declarations: DECLARATIONS,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  exports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, ...DECLARATIONS]
})
export class SharedModule {}
