import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { LegalComponent } from './legal.component';

@NgModule({
  declarations: [LegalComponent],
  imports: [
    SharedModule,
    RouterModule.forChild([
      { path: 'privacy', component: LegalComponent, data: { page: 'privacy' }, title: 'Privacy policy | Daysheet' },
      { path: 'terms', component: LegalComponent, data: { page: 'terms' }, title: 'Terms of service | Daysheet' },
      { path: 'refunds', component: LegalComponent, data: { page: 'refunds' }, title: 'Refunds and cancellation | Daysheet' },
      { path: 'contact', component: LegalComponent, data: { page: 'contact' }, title: 'Contact us | Daysheet' }
    ])
  ]
})
export class LegalModule {}
