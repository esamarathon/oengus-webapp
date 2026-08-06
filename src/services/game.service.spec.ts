import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { faker } from '@faker-js/faker';
import { GameService } from './game.service';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from './notification.service';
import { TemporalServiceService } from './termporal/temporal-service.service';
import { of } from 'rxjs';

const STUB_TIMEZONE = 'Pacific/Honolulu';

describe('GameService', () => {
  let service: GameService;
  let httpTesting: HttpTestingController;
  let translateStub: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    translateStub = { get: vi.fn().mockReturnValue(of('translated')) };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        GameService,
        { provide: TranslateService, useValue: translateStub },
        { provide: TemporalServiceService, useValue: { timeZone: { timeZone: STUB_TIMEZONE } } },
        { provide: NotificationService, useValue: { toastRaw: vi.fn() } },
      ],
    });
    service = TestBed.inject(GameService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('delete()', () => {
    it('DELETEs a game and toasts success', () => {
      const marathonId = faker.string.alphanumeric(8);
      const gameId = faker.number.int({ min: 1, max: 9999 });

      service.delete(marathonId, gameId);

      const req = httpTesting.expectOne((r) => r.url.includes(`/v1/marathons/${marathonId}/submissions/games/${gameId}`));
      expect(req.request.method).toBe('DELETE');
      req.flush(null);

      expect(translateStub.get).toHaveBeenCalledWith('alert.game.deletion.success');
    });
  });

  describe('exportAllForMarathon()', () => {
    it('GETs CSV export with locale and timezone params', () => {
      const marathonId = faker.string.alphanumeric(8);
      localStorage.setItem('language', 'fr');

      service.exportAllForMarathon(marathonId);

      const req = httpTesting.expectOne((r) =>
        r.url.includes(`/v1/marathons/${marathonId}/submissions/export`) &&
        r.url.includes('locale=fr') &&
        r.url.includes(`zoneId=${STUB_TIMEZONE}`)
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('text');
      req.flush('col1,col2\nval1,val2');

      localStorage.removeItem('language');
    });
  });
});
