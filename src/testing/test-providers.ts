import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { LocalizeRouterService } from '@oengusio/ngx-translate-router';
import { Subject } from 'rxjs';

export const commonTestProviders = [
  provideHttpClient(),
  provideHttpClientTesting(),
];

export const routerTestProviders = [
  { provide: ActivatedRoute, useValue: {} },
  { provide: LocalizeRouterService, useValue: { translateRoute: (path: string) => path, routerEvents: new Subject() } },
];
