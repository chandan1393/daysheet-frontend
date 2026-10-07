import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { ClientSummary } from '../core/models';
import { errorMessage } from '../core/utils/errors';
import { listStagger } from '../shared/animations';
import { PortalUiService } from './portal-ui.service';

@Component({
  selector: 'app-clients',
  standalone: false,
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss',
  animations: [listStagger]
})
export class ClientsComponent implements OnInit, OnDestroy {
  clients: ClientSummary[] = [];
  loading = true;
  error = '';
  query = '';
  sort: 'name' | 'recent' | 'visits' = 'name';
  drawerOpen = false;

  private debounce?: ReturnType<typeof setTimeout>;
  private subs: Subscription[] = [];

  constructor(private api: ApiService, private route: ActivatedRoute, private router: Router, private ui: PortalUiService) {}

  ngOnInit(): void {
    this.subs.push(
      this.route.queryParamMap.subscribe(p => {
        this.query = p.get('q') ?? '';
        this.load();
      }),
      this.ui.changed$.subscribe(() => this.load())
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    clearTimeout(this.debounce);
  }

  load(): void {
    this.api.clients(this.query.trim()).subscribe({
      next: list => { this.clients = list; this.loading = false; this.error = ''; },
      error: err => { this.loading = false; this.error = errorMessage(err); }
    });
  }

  onSearch(): void {
    clearTimeout(this.debounce);
    this.debounce = setTimeout(() => this.load(), 250);
  }

  get sorted(): ClientSummary[] {
    const list = [...this.clients];
    if (this.sort === 'recent') {
      list.sort((a, b) => (b.lastVisit ?? '').localeCompare(a.lastVisit ?? ''));
    } else if (this.sort === 'visits') {
      list.sort((a, b) => b.visits - a.visits);
    }
    return list;
  }

  tags(c: ClientSummary): string[] {
    return c.tags ? c.tags.split(',').filter(Boolean) : [];
  }

  open(c: ClientSummary): void {
    this.router.navigate(['/app/clients', c.id]);
  }

  onCreated(c: { id: number }): void {
    this.drawerOpen = false;
    this.router.navigate(['/app/clients', c.id]);
  }
}
