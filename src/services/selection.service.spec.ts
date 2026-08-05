import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { faker } from '@faker-js/faker';
import { SelectionService } from './selection.service';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from './notification.service';
import { of } from 'rxjs';

describe('SelectionService', () => {
  let service: SelectionService;
  let httpTesting: HttpTestingController;
  let translateStub: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    translateStub = { get: vi.fn().mockReturnValue(of('translated')) };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        SelectionService,
        { provide: TranslateService, useValue: translateStub },
        { provide: NotificationService, useValue: { toastRaw: vi.fn() } },
      ],
    });
    service = TestBed.inject(SelectionService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  describe('getAllForMarathon()', () => {
    it('GETs selections with status params', () => {
      const marathonId = faker.string.alphanumeric(8);
      const statuses = ['ACCEPTED', 'REJECTED'];

      service.getAllForMarathon(marathonId, statuses).subscribe();

      const req = httpTesting.expectOne((r) =>
        r.url.includes(`/v1/marathons/${marathonId}/selections`) &&
        r.params.get('status') === 'ACCEPTED,REJECTED'
      );
      expect(req.request.method).toBe('GET');
      req.flush({});
    });
  });

  describe('getAllForMarathonAdmin()', () => {
    it('GETs admin selections endpoint', () => {
      const marathonId = faker.string.alphanumeric(8);

      service.getAllForMarathonAdmin(marathonId).subscribe();

      const req = httpTesting.expectOne((r) => r.url.includes(`/v1/marathons/${marathonId}/selections/admin`));
      expect(req.request.method).toBe('GET');
      req.flush({});
    });
  });

  describe('save()', () => {
    it('PUTs selections and toasts success', () => {
      const marathonId = faker.string.alphanumeric(8);
      const selections = [{ categoryId: 1, status: 'ACCEPTED' }];

      service.save(marathonId, selections as any);

      const req = httpTesting.expectOne((r) => r.url.includes(`/v1/marathons/${marathonId}/selections`));
      expect(req.request.method).toBe('PUT');
      req.flush(null);

      expect(translateStub.get).toHaveBeenCalledWith('alert.selection.save.success');
    });
  });
});
