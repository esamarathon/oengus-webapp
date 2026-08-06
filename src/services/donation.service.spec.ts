import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { faker } from '@faker-js/faker';
import { DonationService } from './donation.service';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from './notification.service';
import { TemporalServiceService } from './termporal/temporal-service.service';
import { of } from 'rxjs';

describe('DonationService', () => {
  let service: DonationService;
  let httpTesting: HttpTestingController;
  let translateStub: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    translateStub = { get: vi.fn().mockReturnValue(of('translated')) };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        DonationService,
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: TranslateService, useValue: translateStub },
        { provide: TemporalServiceService, useValue: { timeZone: { timeZone: 'Europe/Amsterdam' } } },
        { provide: NotificationService, useValue: { toastRaw: vi.fn() } },
      ],
    });
    service = TestBed.inject(DonationService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('find()', () => {
    it('GETs paginated donations', () => {
      const marathonId = faker.string.alphanumeric(8);
      const page = 1;
      const size = 10;

      service.find(marathonId, page, size).subscribe((result) => {
        expect(result.content).toHaveLength(0);
      });

      const req = httpTesting.expectOne((r) =>
        r.url.includes(`/v1/marathons/${marathonId}/donations`) &&
        r.params.get('page') === '1' &&
        r.params.get('size') === '10'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ content: [], totalPages: 0 });
    });
  });

  describe('findStats()', () => {
    it('GETs donation stats', () => {
      const marathonId = faker.string.alphanumeric(8);
      const stats = { total: 1500, average: 25, max: 100, count: 60 };

      service.findStats(marathonId).subscribe((result) => {
        expect(result.total).toBe(1500);
      });

      const req = httpTesting.expectOne((r) => r.url.includes(`/v1/marathons/${marathonId}/donations/stats`));
      expect(req.request.method).toBe('GET');
      req.flush(stats);
    });
  });

  describe('donate()', () => {
    it('POSTs a donation', () => {
      const marathonId = faker.string.alphanumeric(8);
      const donation = { amount: 25, nickname: faker.person.firstName() };

      service.donate(marathonId, donation as any).subscribe();

      const req = httpTesting.expectOne((r) => r.url.includes(`/v1/marathons/${marathonId}/donations/donate`));
      expect(req.request.method).toBe('POST');
      req.flush(null, { status: 200, statusText: 'OK' });
    });
  });

  describe('cancel()', () => {
    it('DELETEs a donation by orderId', () => {
      const marathonId = faker.string.alphanumeric(8);
      const orderId = faker.string.alphanumeric(12);

      service.cancel(marathonId, orderId).subscribe();

      const req = httpTesting.expectOne((r) => r.url.includes(`/v1/marathons/${marathonId}/donations/${orderId}`));
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('validate()', () => {
    it('POSTs to validate a donation and toasts success', () => {
      const marathonId = faker.string.alphanumeric(8);
      const orderId = faker.string.alphanumeric(12);

      service.validate(marathonId, orderId);

      const req = httpTesting.expectOne((r) => r.url.includes(`/v1/marathons/${marathonId}/donations/validate/${orderId}`));
      expect(req.request.method).toBe('POST');
      req.flush(null);

      expect(translateStub.get).toHaveBeenCalledWith('alert.donation.validate.success');
    });
  });

  describe('exportAllForMarathon()', () => {
    it('GETs CSV export with timezone param', () => {
      const marathonId = faker.string.alphanumeric(8);

      service.exportAllForMarathon(marathonId);

      const req = httpTesting.expectOne((r) =>
        r.url.includes(`/v1/marathons/${marathonId}/donations/export`) &&
        r.url.includes('zoneId=Europe/Amsterdam')
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('text');
      req.flush('col1,col2\nval1,val2');
    });
  });
});
