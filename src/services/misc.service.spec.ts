import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { faker } from '@faker-js/faker';
import { MiscService } from './misc.service';
import { NotificationService } from './notification.service';
import { vi } from 'vitest';

describe('MiscService', () => {
  let service: MiscService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MiscService,
        { provide: NotificationService, useValue: { toastRaw: vi.fn() } },
      ],
    });
    service = TestBed.inject(MiscService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('searchPronouns()', () => {
    it('should GET pronouns matching search term', () => {
      const search = faker.string.alpha(3);
      const response = ['he/him', 'she/her'];

      service.searchPronouns(search).subscribe((result) => {
        expect(result).toEqual(response);
      });

      const req = httpTesting.expectOne((r) => r.url.includes(`/v1/pronouns?search=${search}`));
      expect(req.request.method).toBe('GET');
      req.flush(response);
    });
  });

  describe('searchLanguage()', () => {
    it('should GET languages with search and locale params', () => {
      const search = faker.string.alpha(3);
      localStorage.setItem('language', 'nl');
      const response = [{ text: 'Dutch', value: 'nl' }];

      service.searchLanguage(search).subscribe((result) => {
        expect(result).toHaveLength(1);
        expect(result[0].text).toBe('Dutch');
      });

      const req = httpTesting.expectOne((r) =>
        r.url.includes(`/v1/languages?search=${search}`) &&
        r.url.includes('locale=nl')
      );
      expect(req.request.method).toBe('GET');
      req.flush(response);
    });
  });
});
