import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { faker } from '@faker-js/faker';
import { IncentiveService } from './incentive.service';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from './notification.service';
import { of } from 'rxjs';

describe('IncentiveService', () => {
  let service: IncentiveService;
  let httpTesting: HttpTestingController;
  let translateStub: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    translateStub = { get: vi.fn().mockReturnValue(of('translated')) };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        IncentiveService,
        { provide: TranslateService, useValue: translateStub },
        { provide: NotificationService, useValue: { toastRaw: vi.fn() } },
      ],
    });
    service = TestBed.inject(IncentiveService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('getAllForMarathon()', () => {
    it('GETs incentives with filter params', () => {
      const marathonId = faker.string.alphanumeric(8);

      service.getAllForMarathon(marathonId, true, false).subscribe((result) => {
        expect(result).toHaveLength(1);
      });

      const req = httpTesting.expectOne((r) =>
        r.url.includes(`/v1/marathons/${marathonId}/incentives`) &&
        r.url.includes('withLocked=true') &&
        r.url.includes('withUnapproved=false')
      );
      expect(req.request.method).toBe('GET');
      req.flush([{ id: 1, name: 'Test Incentive' }]);
    });
  });

  describe('saveAll()', () => {
    it('POSTs incentives and toasts success', () => {
      const marathonId = faker.string.alphanumeric(8);
      const incentives = [{ id: 1, name: 'Test' }];

      service.saveAll(marathonId, incentives as any);

      const req = httpTesting.expectOne((r) => r.url.includes(`/v1/marathons/${marathonId}/incentives`));
      expect(req.request.method).toBe('POST');
      req.flush(null, { status: 200, statusText: 'OK' });

      expect(translateStub.get).toHaveBeenCalledWith('alert.incentives.save.success');
    });
  });

  describe('delete()', () => {
    it('DELETEs an incentive and toasts success', () => {
      const marathonId = faker.string.alphanumeric(8);
      const incentiveId = faker.number.int({ min: 1, max: 9999 });

      service.delete(marathonId, incentiveId);

      const req = httpTesting.expectOne((r) => r.url.includes(`/v1/marathons/${marathonId}/incentives/${incentiveId}`));
      expect(req.request.method).toBe('DELETE');
      req.flush(null);

      expect(translateStub.get).toHaveBeenCalledWith('alert.incentives.delete.success');
    });
  });
});
