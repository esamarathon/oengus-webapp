import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { faker } from '@faker-js/faker';
import { MarathonService } from './marathon.service';
import { UserService } from './user.service';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from './notification.service';
import { TemporalServiceService } from './termporal/temporal-service.service';
import { makeBasicUserInfo, makeMarathon, makeMarathonRaw, makeMarathonSettingsRaw } from '../testing';
import { of } from 'rxjs';

describe('MarathonService', () => {
  let service: MarathonService;
  let httpTesting: HttpTestingController;
  let routerStub: { navigate: ReturnType<typeof vi.fn> };
  let userServiceStub: { user: ReturnType<typeof makeBasicUserInfo> };
  let translateStub: { get: ReturnType<typeof vi.fn> };
  let temporalStub: {
    parseDate: ReturnType<typeof vi.fn>;
    now: Temporal.ZonedDateTime;
    timeZone: { timeZone: string };
  };

  beforeEach(() => {
    routerStub = { navigate: vi.fn() };
    userServiceStub = { user: makeBasicUserInfo() };
    translateStub = { get: vi.fn().mockReturnValue(of('translated')) };
    temporalStub = {
      parseDate: vi.fn((val: string | number) => {
        if (typeof val === 'number') {
          return Temporal.Instant.fromEpochMilliseconds(val).toZonedDateTimeISO('UTC');
        }
        return Temporal.Instant.from(val).toZonedDateTimeISO('UTC');
      }),
      now: Temporal.Now.zonedDateTimeISO(),
      timeZone: { timeZone: 'Europe/Amsterdam' },
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MarathonService,
        { provide: Router, useValue: routerStub },
        { provide: UserService, useValue: userServiceStub },
        { provide: TranslateService, useValue: translateStub },
        { provide: TemporalServiceService, useValue: temporalStub },
        { provide: NotificationService, useValue: { toastRaw: vi.fn() } },
      ],
    });
    service = TestBed.inject(MarathonService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  describe('find()', () => {
    it('GETs the marathon by name and maps dates', () => {
      const raw = makeMarathonRaw();

      service.find(raw.id).subscribe((result) => {
        expect(result.id).toBe(raw.id);
        expect(result.name).toBe(raw.name);
        expect(temporalStub.parseDate).toHaveBeenCalledWith(raw.startDate);
      });

      const req = httpTesting.expectOne((r) => r.url.includes(`/v1/marathons/${raw.id}`));
      expect(req.request.method).toBe('GET');
      req.flush(raw);
    });
  });

  describe('exists()', () => {
    it('GETs existence check for a marathon name', () => {
      const name = faker.string.alphanumeric(6);
      const response = { exists: true };

      service.exists(name).subscribe((result) => {
        expect(result).toEqual(response);
      });

      const req = httpTesting.expectOne((r) => r.url.includes(`/v1/marathons/${name}/exists`));
      expect(req.request.method).toBe('GET');
      req.flush(response);
    });
  });

  describe('findHomepageMetadata()', () => {
    it('GETs homepage metadata from v2 endpoint and maps marathons', () => {
      const raw = {
        live: [makeMarathonRaw()],
        next: [makeMarathonRaw()],
        open: [makeMarathonRaw()],
      };

      service.findHomepageMetadata().subscribe((result) => {
        expect(result.live).toHaveLength(1);
        expect(result.next).toHaveLength(1);
        expect(result.open).toHaveLength(1);
        expect(result.moderated).toEqual([]);
      });

      const req = httpTesting.expectOne((r) => r.url.includes('/v2/marathons/for-home'));
      expect(req.request.method).toBe('GET');
      req.flush(raw);
    });
  });

  describe('findForMonth()', () => {
    it('GETs marathons for a date range with correct params', () => {
      const start = faker.date.recent();
      const end = faker.date.soon();

      service.findForMonth(start, end).subscribe((result) => {
        expect(result).toHaveLength(1);
      });

      const req = httpTesting.expectOne((r) => r.url.includes('/v1/marathons/forDates'));
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('start')).toBe(start.toISOString());
      expect(req.request.params.get('end')).toBe(end.toISOString());
      expect(req.request.params.get('zoneId')).toBe('Europe/Amsterdam');
      req.flush([makeMarathonRaw()]);
    });
  });

  describe('loadSettings()', () => {
    it('GETs settings from v2 and maps dates', () => {
      const marathonId = faker.string.alphanumeric(8);
      const raw = makeMarathonSettingsRaw({ id: marathonId });

      service.loadSettings(marathonId).subscribe((result) => {
        expect(result.id).toBe(marathonId);
        expect(temporalStub.parseDate).toHaveBeenCalledWith(raw.startDate);
        expect(temporalStub.parseDate).toHaveBeenCalledWith(raw.endDate);
      });

      const req = httpTesting.expectOne((r) => r.url.includes(`/v2/marathons/${marathonId}/settings`));
      expect(req.request.method).toBe('GET');
      req.flush(raw);
    });
  });

  describe('loadQuestions()', () => {
    it('GETs questions from v2', () => {
      const marathonId = faker.string.alphanumeric(8);
      const response = { data: [{ id: 1, label: 'Pronouns', fieldType: 'text', required: true, options: [], type: 'SUBMISSION', description: '', position: 0 }] };

      service.loadQuestions(marathonId).subscribe((result) => {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].label).toBe('Pronouns');
      });

      const req = httpTesting.expectOne((r) => r.url.includes(`/v2/marathons/${marathonId}/settings/questions`));
      expect(req.request.method).toBe('GET');
      req.flush(response);
    });
  });

  describe('updateModerators()', () => {
    it('PUTs user IDs and returns status', () => {
      const marathonId = faker.string.alphanumeric(8);
      const userIds = [faker.number.int(), faker.number.int()];

      service.updateModerators(marathonId, userIds).subscribe((result) => {
        expect(result).toBe(true);
      });

      const req = httpTesting.expectOne((r) => r.url.includes(`/v2/marathons/${marathonId}/settings/moderators`));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ userIds });
      req.flush({ status: true });
    });
  });

  describe('updateQuestions()', () => {
    it('PUTs questions and returns status', () => {
      const marathonId = faker.string.alphanumeric(8);
      const questions = [{ id: 1, label: 'Test', fieldType: 'text', required: false, options: [], type: 'SUBMISSION' as const, description: '', position: 0 }];

      service.updateQuestions(marathonId, questions).subscribe((result) => {
        expect(result).toBe(true);
      });

      const req = httpTesting.expectOne((r) => r.url.includes(`/v2/marathons/${marathonId}/settings/questions`));
      expect(req.request.method).toBe('PUT');
      req.flush({ status: true });
    });
  });

  describe('isAdmin()', () => {
    it('returns true if user is the marathon creator', () => {
      const creator = makeBasicUserInfo();
      service.marathon = makeMarathon({ creator, moderators: [] });

      expect(service.isAdmin({ ...creator, roles: ['ROLE_USER'] } as any)).toBe(true);
    });

    it('returns true if user is a moderator', () => {
      const mod = makeBasicUserInfo();
      service.marathon = makeMarathon({ moderators: [mod] });

      expect(service.isAdmin({ ...mod, roles: ['ROLE_USER'] } as any)).toBe(true);
    });

    it('returns true if user has ROLE_ADMIN', () => {
      const admin = makeBasicUserInfo();
      service.marathon = makeMarathon();

      expect(service.isAdmin({ ...admin, roles: ['ROLE_ADMIN'] } as any)).toBe(true);
    });

    it('returns false for a regular user', () => {
      const user = makeBasicUserInfo();
      service.marathon = makeMarathon();

      expect(service.isAdmin({ ...user, roles: ['ROLE_USER'] } as any)).toBe(false);
    });

    it('returns false for null/undefined user', () => {
      expect(service.isAdmin(null as any)).toBe(false);
    });
  });

  describe('mastodonUrl', () => {
    it('returns empty string when marathon has no mastodon', () => {
      service.marathon = makeMarathon({ mastodon: '' });

      expect(service.mastodonUrl).toBe('');
    });

    it('returns parsed mastodon URL when set', () => {
      service.marathon = makeMarathon({ mastodon: '@user@mastodon.social' });

      expect(service.mastodonUrl).toContain('mastodon.social');
    });
  });

  describe('isArchived()', () => {
    it('returns true when endDate is in the past', () => {
      const pastDate = Temporal.Now.zonedDateTimeISO().subtract({ hours: 1 });
      temporalStub.parseDate.mockReturnValue(pastDate);
      temporalStub.now = Temporal.Now.zonedDateTimeISO();

      service.marathon = makeMarathon();

      expect(service.isArchived()).toBe(true);
    });

    it('returns false when endDate is in the future', () => {
      const futureDate = Temporal.Now.zonedDateTimeISO().add({ hours: 1 });
      temporalStub.parseDate.mockReturnValue(futureDate);
      temporalStub.now = Temporal.Now.zonedDateTimeISO();

      service.marathon = makeMarathon();

      expect(service.isArchived()).toBe(false);
    });
  });

  describe('hasDstChange()', () => {
    it('returns false when start and end offsets match', () => {
      const sameOffset = Temporal.Now.zonedDateTimeISO();
      temporalStub.parseDate.mockReturnValue(sameOffset);
      service.marathon = makeMarathon();

      expect(service.hasDstChange()).toBe(false);
    });

    it('returns true when start and end offsets differ', () => {
      const winterDate = Temporal.ZonedDateTime.from('2024-01-15T12:00:00+01:00[Europe/Amsterdam]');
      const summerDate = Temporal.ZonedDateTime.from('2024-07-15T12:00:00+02:00[Europe/Amsterdam]');
      temporalStub.parseDate
        .mockReturnValueOnce(winterDate)
        .mockReturnValueOnce(summerDate);
      service.marathon = makeMarathon();

      expect(service.hasDstChange()).toBe(true);
    });
  });

  describe('fetchDiscordInfo()', () => {
    it('GETs discord invite lookup', () => {
      const marathon = makeMarathon({ discord: 'abc123' });
      const response = { id: '12345', name: 'Test Server' };

      service.fetchDiscordInfo(marathon).subscribe((result) => {
        expect(result).toEqual(response);
      });

      const req = httpTesting.expectOne((r) =>
        r.url.includes(`/v1/marathons/${marathon.id}/discord/lookup-invite`) &&
        r.url.includes('invite_code=abc123')
      );
      expect(req.request.method).toBe('GET');
      req.flush(response);
    });
  });

  describe('isWebhookOnline()', () => {
    it('GETs webhook health check with url param', () => {
      const marathonId = faker.string.alphanumeric(8);
      const webhookUrl = faker.internet.url();

      service.isWebhookOnline(marathonId, webhookUrl).subscribe();

      const req = httpTesting.expectOne((r) =>
        r.url.includes(`/v1/marathons/${marathonId}/webhook`) &&
        r.params.get('url') === webhookUrl
      );
      expect(req.request.method).toBe('GET');
      req.flush({});
    });
  });
});
