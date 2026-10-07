import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { AdminGuard, AdminGuestGuard } from '../core/guards';
import { AdminLoginComponent } from './admin-login.component';
import { AdminShellComponent } from './admin-shell.component';
import { AdminOverviewComponent } from './overview.component';
import { AdminPracticesComponent } from './practices.component';
import { AdminPaymentsComponent } from './payments.component';
import { AdminPricesComponent } from './prices.component';
import { AdminCompanyComponent } from './company.component';
import { AdminAdminsComponent } from './admins.component';

@NgModule({
  declarations: [
    AdminLoginComponent, AdminShellComponent, AdminOverviewComponent, AdminPracticesComponent,
    AdminPaymentsComponent, AdminPricesComponent, AdminCompanyComponent, AdminAdminsComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild([
      { path: 'login', component: AdminLoginComponent, canActivate: [AdminGuestGuard], title: 'Admin sign in | Daysheet' },
      {
        path: '', component: AdminShellComponent, canActivate: [AdminGuard],
        children: [
          { path: '', component: AdminOverviewComponent, title: 'Admin | Daysheet' },
          { path: 'practices', component: AdminPracticesComponent, title: 'Practices | Admin' },
          { path: 'payments', component: AdminPaymentsComponent, title: 'Payments & GST | Admin' },
          { path: 'prices', component: AdminPricesComponent, title: 'Prices | Admin' },
          { path: 'company', component: AdminCompanyComponent, title: 'Company & GST | Admin' },
          { path: 'admins', component: AdminAdminsComponent, title: 'Admins | Admin' }
        ]
      }
    ])
  ]
})
export class AdminModule {}
