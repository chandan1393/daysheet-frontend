import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { LandingComponent } from './landing.component';
import { LandingProblemsComponent } from './sections/problems.component';
import { LandingTourComponent } from './sections/tour.component';
import { LandingCalculatorComponent } from './sections/calculator.component';
import { LandingFeaturesComponent } from './sections/features.component';

@NgModule({
  declarations: [
    LandingComponent, LandingProblemsComponent, LandingTourComponent, LandingCalculatorComponent, LandingFeaturesComponent
  ],
  imports: [SharedModule, RouterModule.forChild([{ path: '', pathMatch: 'full', component: LandingComponent }])]
})
export class LandingModule {}
