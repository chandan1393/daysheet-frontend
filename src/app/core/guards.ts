import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from './services/auth.service';
import { AdminAuthService } from './services/admin-auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    return this.auth.isLoggedIn ? true : this.router.parseUrl('/login');
  }
}

@Injectable({ providedIn: 'root' })
export class GuestGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    return this.auth.isLoggedIn ? this.router.parseUrl('/app') : true;
  }
}

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private admin: AdminAuthService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    return this.admin.isLoggedIn ? true : this.router.parseUrl('/admin/login');
  }
}

@Injectable({ providedIn: 'root' })
export class AdminGuestGuard implements CanActivate {
  constructor(private admin: AdminAuthService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    return this.admin.isLoggedIn ? this.router.parseUrl('/admin') : true;
  }
}
