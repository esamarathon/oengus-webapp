import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { faker } from '@faker-js/faker';
import { ScheduleService } from './schedule.service';
import { TemporalServiceService } from './termporal/temporal-service.service';
import { NotificationService } from './notification.service';

describe('ScheduleService', () => {
  let service: ScheduleService;
  let httpTesting: HttpTestingController;
  let temporalStub: { parseDate: ReturnType<typeof vi.fn>; timeZone: { timeZone: string } };

  beforeEach(() => {
    localStorage.clear();
    temporalStub = {
      parseDate: vi.fn((val: string) =>
        Temporal.Instant.from(val).toZonedDateTimeISO('UTC')
      ),
      timeZone: { timeZone: 'Europe/Amsterdam' },
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ScheduleService,
        { provide: TemporalServiceService, useValue: temporalStub },
        { provide: NotificationService, useValue: { toastRaw: vi.fn() } },
      ],
    });
    service = TestBed.inject(ScheduleService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('getAllOverview()', () => {
    it('GETs schedule list from v2 and unwraps data', () => {
      const marathonId = faker.string.alphanumeric(8);
      const schedules = [{ id: 1, marathonId, name: 'Main', slug: 'main', published: true }];

      service.getAllOverview(marathonId).subscribe((result) => {
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Main');
      });

      const req = httpTesting.expectOne((r) => r.url.includes(`/v2/marathons/${marathonId}/schedules`));
      expect(req.request.method).toBe('GET');
      req.flush({ data: schedules });
    });

    it('returns cached result on second call', () => {
      const marathonId = faker.string.alphanumeric(8);
      const schedules = [{ id: 1, marathonId, name: 'Main', slug: 'main', published: true }];

      service.getAllOverview(marathonId).subscribe();
      httpTesting.expectOne((r) => r.url.includes(`/v2/marathons/${marathonId}/schedules`)).flush({ data: schedules });

      service.getAllOverview(marathonId).subscribe((result) => {
        expect(result).toHaveLength(1);
      });
      httpTesting.expectNone((r) => r.url.includes(`/v2/marathons/${marathonId}/schedules`));
    });
  });

  describe('getInfoById()', () => {
    it('GETs schedule info by id', () => {
      const marathonId = faker.string.alphanumeric(8);
      const scheduleId = faker.number.int({ min: 1, max: 99 });
      const info = { id: scheduleId, marathonId, name: 'Main', slug: 'main', published: true };

      service.getInfoById(marathonId, scheduleId).subscribe((result) => {
        expect(result.id).toBe(scheduleId);
      });

      const req = httpTesting.expectOne((r) => r.url.includes(`/v2/marathons/${marathonId}/schedules/${scheduleId}`));
      expect(req.request.method).toBe('GET');
      req.flush(info);
    });
  });

  describe('isSlugInUse()', () => {
    it('GETs slug existence check', () => {
      const marathonId = faker.string.alphanumeric(8);
      const slug = faker.string.alphanumeric(6);

      service.isSlugInUse(marathonId, slug).subscribe((result) => {
        expect(result.status).toBe(true);
      });

      const req = httpTesting.expectOne((r) =>
        r.url.includes(`/v2/marathons/${marathonId}/schedules/slug-exists`) &&
        r.url.includes(`slug=${slug}`)
      );
      req.flush({ status: true });
    });
  });

  describe('getBySlug()', () => {
    it('GETs schedule by slug and maps line dates', () => {
      const marathonId = faker.string.alphanumeric(8);
      const slug = 'main';
      const lineDate = '2024-06-15T14:00:00Z';

      service.getBySlug(marathonId, slug).subscribe((result) => {
        expect(result.lines).toHaveLength(1);
        expect(temporalStub.parseDate).toHaveBeenCalledWith(lineDate);
      });

      const req = httpTesting.expectOne((r) => r.url.includes(`/v2/marathons/${marathonId}/schedules/for-slug/${slug}`));
      req.flush({ id: 1, lines: [{ id: 1, date: lineDate, gameName: 'Test' }] });
    });
  });

  describe('createSchedule()', () => {
    it('POSTs new schedule', () => {
      const marathonId = faker.string.alphanumeric(8);
      const data = { name: 'New Schedule', slug: 'new-schedule' };

      service.createSchedule(marathonId, data as any).subscribe((result) => {
        expect(result.name).toBe('New Schedule');
      });

      const req = httpTesting.expectOne((r) => r.url.includes(`/v2/marathons/${marathonId}/schedules`));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(data);
      req.flush({ id: 1, marathonId, ...data, published: false });
    });
  });

  describe('deleteById()', () => {
    it('DELETEs a schedule', () => {
      const marathonId = faker.string.alphanumeric(8);
      const scheduleId = faker.number.int({ min: 1, max: 99 });

      service.deleteById(marathonId, scheduleId).subscribe();

      const req = httpTesting.expectOne((r) => r.url.includes(`/v2/marathons/${marathonId}/schedules/${scheduleId}/manage`));
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('publish()', () => {
    it('POSTs to publish a schedule', () => {
      const marathonId = faker.string.alphanumeric(8);
      const scheduleId = faker.number.int({ min: 1, max: 99 });

      service.publish(marathonId, scheduleId).subscribe((result) => {
        expect(result.status).toBe(true);
      });

      const req = httpTesting.expectOne((r) => r.url.includes(`/v2/marathons/${marathonId}/schedules/${scheduleId}/manage/publish`));
      expect(req.request.method).toBe('POST');
      req.flush({ status: true });
    });
  });

  describe('getExportUrl()', () => {
    it('builds export URL with format, zoneId and locale', () => {
      const marathonId = faker.string.alphanumeric(8);
      const scheduleId = faker.number.int({ min: 1, max: 99 });
      localStorage.setItem('language', 'nl');

      const url = service.getExportUrl(marathonId, scheduleId, 'csv');

      expect(url).toContain(`/v2/marathons/${marathonId}/schedules/${scheduleId}/export`);
      expect(url).toContain('format=csv');
      expect(url).toContain('zoneId=Europe/Amsterdam');
      expect(url).toContain('locale=nl');
    });
  });

  describe('getLines()', () => {
    it('GETs schedule lines and maps dates', () => {
      const marathonId = faker.string.alphanumeric(8);
      const scheduleId = faker.number.int({ min: 1, max: 99 });
      const lineDate = '2024-06-15T14:00:00Z';

      service.getLines(marathonId, scheduleId).subscribe((result) => {
        expect(result.data).toHaveLength(1);
        expect(temporalStub.parseDate).toHaveBeenCalledWith(lineDate);
      });

      const req = httpTesting.expectOne((r) => r.url.includes(`/v2/marathons/${marathonId}/schedules/${scheduleId}/manage/lines`));
      expect(req.request.method).toBe('GET');
      req.flush({ data: [{ id: 1, date: lineDate, gameName: 'Test' }] });
    });
  });
});
