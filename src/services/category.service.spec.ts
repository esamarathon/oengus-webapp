import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { faker } from '@faker-js/faker';
import { CategoryService } from './category.service';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from './notification.service';
import { of } from 'rxjs';

describe('CategoryService', () => {
  let service: CategoryService;
  let httpTesting: HttpTestingController;
  let translateStub: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    translateStub = { get: vi.fn().mockReturnValue(of('translated')) };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        CategoryService,
        { provide: TranslateService, useValue: translateStub },
        { provide: NotificationService, useValue: { toastRaw: vi.fn() } },
      ],
    });
    service = TestBed.inject(CategoryService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  describe('getFromCode()', () => {
    it('GETs an opponent by marathon and code', () => {
      const marathonId = faker.string.alphanumeric(8);
      const code = faker.string.alphanumeric(6);
      const opponent = { id: 1, users: [], user: { id: 1, username: 'test', displayName: 'Test' }, gameName: 'Game', categoryId: 1, categoryName: 'Any%', video: '', availabilities: [] };

      service.getFromCode(marathonId, code).subscribe((result) => {
        expect(result.id).toBe(1);
        expect(result.gameName).toBe('Game');
      });

      const req = httpTesting.expectOne((r) => r.url.includes(`/v1/marathons/${marathonId}/categories/${code}`));
      expect(req.request.method).toBe('GET');
      req.flush(opponent);
    });
  });

  describe('delete()', () => {
    it('DELETEs a category and toasts on success', () => {
      const marathonId = faker.string.alphanumeric(8);
      const submissionId = faker.number.int({ min: 1, max: 9999 });

      service.delete(marathonId, submissionId);

      const req = httpTesting.expectOne((r) => r.url.includes(`/v1/marathons/${marathonId}/categories/${submissionId}`));
      expect(req.request.method).toBe('DELETE');
      req.flush(null);

      expect(translateStub.get).toHaveBeenCalledWith('alert.category.deletion.success');
    });
  });
});
