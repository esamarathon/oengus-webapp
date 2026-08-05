import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { faker } from '@faker-js/faker';
import { UserService } from './user.service';
import { NotificationService } from './notification.service';
import { TemporalServiceService } from './termporal/temporal-service.service';
import { makeSelfUser } from '../testing';

describe('UserService', () => {
  let service: UserService;
  let httpTesting: HttpTestingController;
  let routerStub: { navigate: ReturnType<typeof vi.fn> };
  let temporalStub: { parseDate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    localStorage.clear();
    routerStub = { navigate: vi.fn() };
    temporalStub = {
      parseDate: vi.fn((val: string) =>
        Temporal.Instant.from(val).toZonedDateTimeISO('UTC')
      ),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        UserService,
        { provide: Router, useValue: routerStub },
        { provide: TemporalServiceService, useValue: temporalStub },
        { provide: NotificationService, useValue: { toastRaw: vi.fn() } },
      ],
    });
    service = TestBed.inject(UserService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    localStorage.clear();
    httpTesting.verify();
  });

  describe('token getter/setter', () => {
    it('stores and retrieves token from localStorage', () => {
      const token = faker.string.alphanumeric(32);
      service.token = token;

      expect(service.token).toBe(token);
      expect(localStorage.getItem('token')).toBe(token);
    });

    it('removes token when set to null', () => {
      localStorage.setItem('token', 'some-token');
      service.token = null;

      expect(service.token).toBeNull();
    });
  });

  describe('isLoggedIn()', () => {
    it('returns false when no user is set', () => {
      expect(service.isLoggedIn()).toBe(false);
    });

    it('returns true after user is loaded via me()', () => {
      const user = makeSelfUser();

      service.me();
      const req = httpTesting.expectOne((r) => r.url.includes('/v2/users/@me'));
      req.flush(user);

      expect(service.isLoggedIn()).toBe(true);
    });
  });

  describe('isAdmin()', () => {
    it('returns false when no user', () => {
      expect(service.isAdmin()).toBe(false);
    });

    it('returns true when user has ROLE_ADMIN', () => {
      const user = makeSelfUser({ roles: ['ROLE_USER', 'ROLE_ADMIN'] });

      service.me();
      httpTesting.expectOne((r) => r.url.includes('/v2/users/@me')).flush(user);

      expect(service.isAdmin()).toBe(true);
    });
  });

  describe('isBanned()', () => {
    it('returns false when no user', () => {
      expect(service.isBanned()).toBe(false);
    });

    it('returns true when user has ROLE_BANNED', () => {
      const user = makeSelfUser({ roles: ['ROLE_BANNED'] });

      service.me();
      httpTesting.expectOne((r) => r.url.includes('/v2/users/@me')).flush(user);

      expect(service.isBanned()).toBe(true);
    });
  });

  describe('logout()', () => {
    it('clears user state and localStorage, navigates home', () => {
      localStorage.setItem('token', 'abc');
      localStorage.setItem('user', '{}');

      service.logout();

      expect(service.isLoggedIn()).toBe(false);
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(routerStub.navigate).toHaveBeenCalledWith(['/']);
    });

    it('skips navigation when redirectHome=false', () => {
      service.logout(false);

      expect(routerStub.navigate).not.toHaveBeenCalled();
    });
  });

  describe('getMe()', () => {
    it('GETs /v2/users/@me', () => {
      const user = makeSelfUser();

      service.getMe().subscribe((result) => {
        expect(result).toEqual(user);
      });

      const req = httpTesting.expectOne((r) => r.url.includes('/v2/users/@me'));
      expect(req.request.method).toBe('GET');
      req.flush(user);
    });

    it('returns cached user after me() loads it', () => {
      const user = makeSelfUser();

      service.me();
      httpTesting.expectOne((r) => r.url.includes('/v2/users/@me')).flush(user);

      service.getMe().subscribe((result) => {
        expect(result).toEqual(user);
      });
      httpTesting.expectNone((r) => r.url.includes('/v2/users/@me'));
    });
  });

  describe('exists()', () => {
    it('GETs user existence check', () => {
      const name = faker.internet.username();
      const response = { exists: true };

      service.exists(name).subscribe((result) => {
        expect(result).toEqual(response);
      });

      const req = httpTesting.expectOne((r) => r.url.includes(`/v1/users/${name}/exists`));
      expect(req.request.method).toBe('GET');
      req.flush(response);
    });

    it('returns empty observable for empty name', () => {
      let emitted = false;
      service.exists('').subscribe(() => { emitted = true; });

      expect(emitted).toBe(false);
    });
  });

  describe('searchV1()', () => {
    it('GETs user search', () => {
      const name = faker.internet.username();

      service.searchV1(name).subscribe((result) => {
        expect(result).toHaveLength(1);
      });

      const req = httpTesting.expectOne((r) => r.url.includes(`/v1/users/${name}/search`));
      expect(req.request.method).toBe('GET');
      req.flush([{ id: 1, username: name, displayName: name }]);
    });
  });

  describe('getProfile()', () => {
    it('GETs user profile from v2', () => {
      const name = faker.internet.username();

      service.getProfile(name).subscribe((result) => {
        expect(result.username).toBe(name);
      });

      const req = httpTesting.expectOne((r) => r.url.includes(`/v2/users/${name}`));
      expect(req.request.method).toBe('GET');
      req.flush({ id: 1, username: name, displayName: name, enabled: true, pronouns: [], languagesSpoken: [], connections: [], country: '', banned: false, savedGamesPublic: false });
    });
  });

  describe('getSubmissionHistory()', () => {
    it('GETs submission history and maps dates', () => {
      const userId = faker.number.int({ min: 1, max: 9999 });
      const isoDate = faker.date.past().toISOString();

      service.getSubmissionHistory(userId).subscribe((result) => {
        expect(result.data).toHaveLength(1);
        expect(temporalStub.parseDate).toHaveBeenCalledWith(isoDate);
      });

      const req = httpTesting.expectOne((r) => r.url.includes(`/v2/users/${userId}/submission-history`));
      req.flush({
        data: [{ marathonId: 'abc', marathonName: 'Test', marathonStartDate: isoDate, visible: true, games: [] }],
      });
    });
  });

  describe('getModerationHistory()', () => {
    it('GETs moderation history and maps dates', () => {
      const userId = faker.number.int({ min: 1, max: 9999 });
      const isoDate = faker.date.past().toISOString();

      service.getModerationHistory(userId).subscribe((result) => {
        expect(result.data).toHaveLength(1);
        expect(temporalStub.parseDate).toHaveBeenCalledWith(isoDate);
      });

      const req = httpTesting.expectOne((r) => r.url.includes(`/v2/users/${userId}/moderation-history`));
      req.flush({
        data: [{ marathonId: 'abc', marathonName: 'Test', marathonStartDate: isoDate }],
      });
    });
  });

  describe('ban() / unban()', () => {
    it('POSTs to ban a user', () => {
      const userId = faker.number.int({ min: 1, max: 9999 });

      service.ban(userId).subscribe();

      const req = httpTesting.expectOne((r) => r.url.includes(`/v1/users/${userId}/ban`));
      expect(req.request.method).toBe('POST');
      req.flush(null);
    });

    it('DELETEs to unban a user', () => {
      const userId = faker.number.int({ min: 1, max: 9999 });

      service.unban(userId).subscribe();

      const req = httpTesting.expectOne((r) => r.url.includes(`/v1/users/${userId}/ban`));
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('fetchRoles()', () => {
    it('GETs roles from v2 and unwraps data', () => {
      const userId = faker.number.int({ min: 1, max: 9999 });

      service.fetchRoles(userId).subscribe((result) => {
        expect(result).toEqual(['ROLE_USER', 'ROLE_ADMIN']);
      });

      const req = httpTesting.expectOne((r) => r.url.includes(`/v2/users/${userId}/roles`));
      expect(req.request.method).toBe('GET');
      req.flush({ data: ['ROLE_USER', 'ROLE_ADMIN'] });
    });
  });

  describe('getSupporterStatus()', () => {
    it('GETs supporter status from v2', () => {
      const userId = faker.number.int({ min: 1, max: 9999 });
      const status = { sponsor: false, patreon: true, anySupporter: true };

      service.getSupporterStatus(userId).subscribe((result) => {
        expect(result).toEqual(status);
      });

      const req = httpTesting.expectOne((r) => r.url.includes(`/v2/users/${userId}/supporter-status`));
      req.flush(status);
    });
  });
});
