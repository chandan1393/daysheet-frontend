import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { LoginComponent } from './login.component';
import { RegisterComponent } from './register.component';
import { PasswordResetComponent } from './password-reset.component';
import { VerifyEmailComponent } from './verify-email.component';

@NgModule({
  declarations: [LoginComponent, RegisterComponent, PasswordResetComponent, VerifyEmailComponent],
  imports: [
    SharedModule,
    RouterModule.forChild([
      { path: 'login', component: LoginComponent, title: 'Log in' },
      { path: 'register', component: RegisterComponent, title: 'Start your free trial' },
      { path: 'verify-email', component: VerifyEmailComponent, title: 'Confirm your email' },
      { path: 'forgot-password', component: PasswordResetComponent, data: { mode: 'forgot' }, title: 'Reset your password' },
      { path: 'reset-password', component: PasswordResetComponent, data: { mode: 'reset' }, title: 'Choose a new password' }
    ])
  ]
})
export class AuthModule {}
