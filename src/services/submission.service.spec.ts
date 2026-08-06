import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { faker } from '@faker-js/faker';
import { SubmissionService } from './submission.service';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from './notification.service';
import { TemporalServiceService } from './termporal/temporal-service.service';
import { of } from 'rxjs';

describe('SubmissionService', () => {
  let service: SubmissionService;
  let httpTesting: HttpTestingController;
  let translateStub: { get: ReturnType<typeof vi.fn> };
  let temporalStub: { parseDate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    translateStub = { get: vi.fn().mockReturnValue(of('translated')) };
    temporalStub = {
      parseDate: vi.fn((val: string) =>
        Temporal.Instant.from(val).toZonedDateTimeISO('UTC')
      ),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        SubmissionService,
        { provide: TranslateService, useValue: translateStub },
        { provide: TemporalServiceService, useValue: temporalStub },
        { provide: NotificationService, useValue: { toastRaw: vi.fn() } },
      ],
    });
    service = TestBed.inject(SubmissionService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('mine()', () => {
    it('GETs own submission and maps availabilities', async () => {
      const marathonId = faker.string.alphanumeric(8);
      const isoFrom = '2024-06-01T10:00:00Z';
      const isoTo = '2024-06-01T18:00:00Z';
      const raw = {
        id: 1,
        user: { id: 1, username: 'runner', displayName: 'Runner' },
        games: [],
        availabilities: [{ from: isoFrom, to: isoTo, username: 'runner' }],
        answers: [],
        opponents: [],
      };

      const promise = service.mine(marathonId);

      const req = httpTesting.expectOne((r) => r.url.includes(`/v1/marathons/${marathonId}/submissions/me`));
      expect(req.request.method).toBe('GET');
      req.flush(raw);

      const result = await promise;
      expect(result).not.toBeNull();
      expect(temporalStub.parseDate).toHaveBeenCalledWith(isoFrom);
      expect(temporalStub.parseDate).toHaveBeenCalledWith(isoTo);
    });

    it('returns null on 404', async () => {
      const marathonId = faker.string.alphanumeric(8);

      const promise = service.mine(marathonId);

      const req = httpTesting.expectOne((r) => r.url.includes(`/v1/marathons/${marathonId}/submissions/me`));
      req.flush(null, { status: 404, statusText: 'Not Found' });

      const result = await promise;
      expect(result).toBeNull();
    });
  });

  describe('submissions()', () => {
    it('GETs paginated submissions', () => {
      const marathonId = faker.string.alphanumeric(8);
      const page = faker.number.int({ min: 1, max: 5 });
      const response = { content: [], first: true, last: true, empty: true, totalPages: 0, currentPage: page };

      service.submissions(marathonId, page).subscribe((result) => {
        expect(result.currentPage).toBe(page);
      });

      const req = httpTesting.expectOne((r) => r.url.includes(`/v1/marathons/${marathonId}/submissions?page=${page}`));
      expect(req.request.method).toBe('GET');
      req.flush(response);
    });
  });

  describe('searchSubmissions()', () => {
    it('GETs search with query and status params', () => {
      const marathonId = faker.string.alphanumeric(8);
      const query = faker.person.firstName();
      const status = 'TODO';

      service.searchSubmissions(marathonId, query, status).subscribe();

      const req = httpTesting.expectOne((r) =>
        r.url.includes(`/v1/marathons/${marathonId}/submissions/search`) &&
        r.params.get('q') === query &&
        r.params.get('status') === status
      );
      expect(req.request.method).toBe('GET');
      req.flush({ content: [], first: true, last: true, empty: true, totalPages: 0, currentPage: 1 });
    });

    it('omits status param when not provided', () => {
      const marathonId = faker.string.alphanumeric(8);
      const query = faker.person.firstName();

      service.searchSubmissions(marathonId, query).subscribe();

      const req = httpTesting.expectOne((r) =>
        r.url.includes(`/v1/marathons/${marathonId}/submissions/search`) &&
        r.params.get('q') === query &&
        !r.params.has('status')
      );
      req.flush({ content: [], first: true, last: true, empty: true, totalPages: 0, currentPage: 1 });
    });
  });

  describe('answers()', () => {
    it('GETs answers for a marathon', () => {
      const marathonId = faker.string.alphanumeric(8);
      const answers = [{ id: 1, questionId: 1, submissionId: 1, answer: 'yes' }];

      service.answers(marathonId).subscribe((result) => {
        expect(result).toHaveLength(1);
      });

      const req = httpTesting.expectOne((r) => r.url.includes(`/v1/marathons/${marathonId}/submissions/answers`));
      expect(req.request.method).toBe('GET');
      req.flush(answers);
    });
  });

  describe('availabilities()', () => {
    it('GETs and maps availabilities', () => {
      const marathonId = faker.string.alphanumeric(8);
      const raw = {
        runner1: [{ from: '2024-06-01T10:00:00Z', to: '2024-06-01T18:00:00Z', username: 'runner1' }],
      };

      service.availabilities(marathonId).subscribe((result) => {
        expect(result['runner1']).toHaveLength(1);
        expect(temporalStub.parseDate).toHaveBeenCalledWith('2024-06-01T10:00:00Z');
      });

      const req = httpTesting.expectOne((r) => r.url.includes(`/v1/marathons/${marathonId}/submissions/availabilities`));
      req.flush(raw);
    });
  });

  describe('availabilitiesForUser()', () => {
    it('GETs user-specific availabilities', () => {
      const marathonId = faker.string.alphanumeric(8);
      const userId = faker.number.int({ min: 1, max: 9999 });
      const raw = {
        runner1: [{ from: '2024-06-01T10:00:00Z', to: '2024-06-01T18:00:00Z', username: 'runner1' }],
      };

      service.availabilitiesForUser(marathonId, userId).subscribe((result) => {
        expect(result['runner1']).toHaveLength(1);
      });

      const req = httpTesting.expectOne((r) => r.url.includes(`/v1/marathons/${marathonId}/submissions/availabilities/${userId}`));
      req.flush(raw);
    });
  });

  describe('delete()', () => {
    it('DELETEs a submission and toasts success', () => {
      const marathonId = faker.string.alphanumeric(8);
      const submissionId = faker.number.int({ min: 1, max: 9999 });

      service.delete(marathonId, submissionId);

      const req = httpTesting.expectOne((r) => r.url.includes(`/v1/marathons/${marathonId}/submissions/${submissionId}`));
      expect(req.request.method).toBe('DELETE');
      req.flush(null);

      expect(translateStub.get).toHaveBeenCalledWith('alert.submission.deletion.success');
    });
  });
});
