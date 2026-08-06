import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PatreonService } from './patreon.service';
import { NotificationService } from './notification.service';

describe('PatreonService', () => {
  let service: PatreonService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        PatreonService,
        { provide: NotificationService, useValue: { toastRaw: vi.fn() } },
      ],
    });
    service = TestBed.inject(PatreonService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('fetchPatrons()', () => {
    it('should GET patrons from patreon API', () => {
      const response = { patrons: [{ full_name: 'Alice', image_url: 'http://img.test/a', id: '1' }] };

      service.fetchPatrons().subscribe((result) => {
        expect(result.patrons).toHaveLength(1);
        expect(result.patrons[0].full_name).toBe('Alice');
      });

      const req = httpTesting.expectOne((r) => r.url.includes('/patrons'));
      expect(req.request.method).toBe('GET');
      req.flush(response);
    });

    it('should return cached result on second call', () => {
      const response = { patrons: [{ full_name: 'Bob', image_url: '', id: '2' }] };

      service.fetchPatrons().subscribe();
      httpTesting.expectOne((r) => r.url.includes('/patrons')).flush(response);

      service.fetchPatrons().subscribe((result) => {
        expect(result.patrons[0].full_name).toBe('Bob');
      });
      httpTesting.expectNone((r) => r.url.includes('/patrons'));
    });
  });
});
