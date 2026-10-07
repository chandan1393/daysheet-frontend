import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { BookingPageComponent } from './booking-page.component';

@NgModule({
  declarations: [BookingPageComponent],
  imports: [SharedModule, RouterModule.forChild([{ path: '', component: BookingPageComponent }])]
})
export class BookingModule {}
