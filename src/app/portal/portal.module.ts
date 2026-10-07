import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { PortalUiService } from './portal-ui.service';
import { ShellComponent } from './shell.component';
import { DashboardComponent } from './dashboard.component';
import { RevenueChartComponent } from './revenue-chart.component';
import { CalendarComponent } from './calendar.component';
import { AppointmentFormComponent } from './appointment-form.component';
import { AppointmentDetailsComponent } from './appointment-details.component';
import { ClientsComponent } from './clients.component';
import { ClientDetailComponent } from './client-detail.component';
import { ClientFormComponent } from './client-form.component';
import { ServicesComponent } from './services.component';
import { InvoicesComponent } from './invoices.component';
import { InvoiceFormComponent } from './invoice-form.component';
import { InvoiceViewComponent } from './invoice-view.component';
import { SettingsComponent } from './settings.component';
import { DocChipComponent } from './doc-chip.component';
import { FileDropComponent } from './file-drop.component';
import { DocumentViewerComponent } from './document-viewer.component';
import { VisitRecordComponent } from './visit-record.component';
import { PrescriptionEditorComponent } from './prescription-editor.component';
import { PrescriptionViewComponent } from './prescription-view.component';
import { CasesComponent } from './cases.component';
import { DeadlinesComponent } from './deadlines.component';

const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', component: DashboardComponent, data: { page: 'today' }, title: 'Today' },
      { path: 'calendar', component: CalendarComponent, data: { page: 'calendar' }, title: 'Calendar' },
      { path: 'clients', component: ClientsComponent, data: { page: 'clients' }, title: 'People' },
      { path: 'clients/:id', component: ClientDetailComponent, data: { page: 'clients' }, title: 'Profile' },
      { path: 'services', component: ServicesComponent, data: { page: 'services' }, title: 'Services' },
      { path: 'invoices', component: InvoicesComponent, data: { page: 'invoices' }, title: 'Invoices' },
      { path: 'cases', component: CasesComponent, data: { page: 'cases' }, title: 'Cases' },
      { path: 'deadlines', component: DeadlinesComponent, data: { page: 'deadlines' }, title: 'Deadlines' },
      { path: 'settings', component: SettingsComponent, data: { page: 'settings' }, title: 'Settings' }
    ]
  }
];

@NgModule({
  declarations: [
    ShellComponent, DashboardComponent, RevenueChartComponent, CalendarComponent,
    AppointmentFormComponent, AppointmentDetailsComponent,
    ClientsComponent, ClientDetailComponent, ClientFormComponent,
    ServicesComponent, InvoicesComponent, InvoiceFormComponent, InvoiceViewComponent, SettingsComponent,
    DocChipComponent, FileDropComponent, DocumentViewerComponent, VisitRecordComponent,
    PrescriptionEditorComponent, PrescriptionViewComponent, CasesComponent, DeadlinesComponent
  ],
  imports: [SharedModule, RouterModule.forChild(routes)],
  providers: [PortalUiService]
})
export class PortalModule {}
