import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AdminAuthService } from '../core/services/admin-auth.service';
import { routeAnimation } from '../shared/animations';

@Component({
  selector: 'app-admin-shell',
  standalone: false,
  animations: [routeAnimation],
  template: `
    <div class="layout" [class.open]="menuOpen">
      <aside class="side">
        <a class="brand" routerLink="/admin"><span class="mark"><i></i><i></i><i></i></span><span>Daysheet<small>Admin</small></span></a>
        <nav>
          @for (n of nav; track n.path) {
            <a [routerLink]="n.path" routerLinkActive="on" [routerLinkActiveOptions]="{ exact: n.path === '/admin' }" (click)="menuOpen = false">
              <app-icon [name]="n.icon" [size]="18" />{{ n.label }}
            </a>
          }
        </nav>
        <div class="me">
          <span class="who"><strong>{{ auth.admin?.fullName }}</strong><small>{{ auth.admin?.email }}</small></span>
          <button class="btn btn-ghost btn-icon btn-sm out" (click)="auth.logout()" aria-label="Sign out"><app-icon name="logout" [size]="17" /></button>
        </div>
      </aside>
      <div class="scrim" (click)="menuOpen = false"></div>
      <main>
        <header class="top">
          <button class="btn btn-ghost btn-icon menu" (click)="menuOpen = true" aria-label="Menu"><app-icon name="menu" /></button>
          <span class="badge"><app-icon name="sliders" [size]="14" />Admin panel</span>
          <span class="spacer"></span>
          <a class="btn btn-sm" routerLink="/" target="_blank"><app-icon name="external" [size]="14" />View site</a>
        </header>
        <div class="content" [@routeAnim]="key(outlet)"><router-outlet #outlet="outlet" /></div>
      </main>
    </div>`,
  styles: [`
    .layout { display: grid; grid-template-columns: 240px minmax(0, 1fr); min-height: 100vh; }
    .side { position: sticky; top: 0; height: 100vh; background: #0B1628; color: #C9D4E4; display: flex; flex-direction: column; padding: 18px 12px; }
    .brand { display: flex; align-items: center; gap: 10px; padding: 6px 10px 18px; color: #fff; font-family: var(--font-display); font-weight: 800; font-size: 18px; }
    .brand:hover { text-decoration: none; }
    .brand small { display: block; font-family: var(--font-ui); font-weight: 600; font-size: 11.5px; color: var(--marigold); letter-spacing: .02em; }
    .mark { width: 30px; height: 30px; border-radius: 9px; background: var(--ink-2); display: flex; flex-direction: column; justify-content: center; gap: 3px; padding: 0 7px; }
    .mark i { height: 4px; border-radius: 2px; background: var(--lagoon-glow); } .mark i:first-child { background: var(--marigold); } .mark i:last-child { width: 70%; opacity: .6; }
    nav { display: flex; flex-direction: column; gap: 2px; flex: 1; }
    nav a { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 10px; color: #A9B8CD; font-weight: 600; font-size: 14px; position: relative; transition: background-color .2s, color .2s; }
    nav a:hover { color: #fff; background: rgba(255,255,255,.05); text-decoration: none; }
    nav a.on { color: #fff; background: rgba(255,255,255,.09); }
    nav a.on::before { content: ''; position: absolute; left: -12px; top: 9px; bottom: 9px; width: 3px; border-radius: 0 3px 3px 0; background: var(--marigold); }
    .me { display: flex; align-items: center; gap: 8px; padding: 12px 8px 4px; border-top: 1px solid rgba(255,255,255,.08); }
    .who { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .who strong { color: #fff; font-size: 13.5px; } .who small { font-size: 12px; color: #7F92AD; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .out { color: #A9B8CD; }
    main { min-width: 0; }
    .top { display: flex; align-items: center; gap: 10px; height: 60px; padding: 0 28px; border-bottom: 1px solid var(--line); background: var(--surface); position: sticky; top: 0; z-index: 5; }
    .badge { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 700; color: var(--marigold-deep); background: var(--marigold-wash); padding: 4px 10px; border-radius: 99px; }
    .menu { display: none; }
    .content { padding: 26px 28px 48px; max-width: 1240px; }
    .scrim { display: none; }
    @media (max-width: 900px) {
      .layout { grid-template-columns: 1fr; }
      .side { position: fixed; left: 0; top: 0; bottom: 0; width: 250px; z-index: 30; transform: translateX(-100%); transition: transform .3s var(--ease-out); }
      .open .side { transform: none; }
      .open .scrim { display: block; position: fixed; inset: 0; background: rgba(11,22,40,.45); z-index: 25; }
      .menu { display: inline-flex; }
      .top { padding: 0 14px; }
      .content { padding: 18px 16px 40px; }
    }
  `]
})
export class AdminShellComponent {
  menuOpen = false;
  readonly nav = [
    { path: '/admin', label: 'Overview', icon: 'today' },
    { path: '/admin/practices', label: 'Practices', icon: 'users' },
    { path: '/admin/payments', label: 'Payments & GST', icon: 'receipt' },
    { path: '/admin/prices', label: 'Prices', icon: 'wallet' },
    { path: '/admin/company', label: 'Company & GST', icon: 'globe' },
    { path: '/admin/admins', label: 'Admins & activity', icon: 'user' }
  ];

  constructor(public auth: AdminAuthService, router: Router) {
    router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.menuOpen = false);
  }

  key(outlet: RouterOutlet): string {
    return outlet.isActivated ? outlet.activatedRoute.snapshot.url.join('/') || 'overview' : '';
  }
}
