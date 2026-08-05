import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { faker } from '@faker-js/faker';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { commonTestProviders } from '../testing';

describe('AuthService (token logic)', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...commonTestProviders,
        AuthService,
        { provide: NotificationService, useValue: { toastRaw: vi.fn() } },
      ],
    });
    service = TestBed.inject(AuthService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  function makeJwt(payload: Record<string, unknown>): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify(payload));
    const sig = faker.string.alphanumeric(16);
    return `${header}.${body}.${sig}`;
  }

  describe('token getter/setter', () => {
    it('stores and retrieves token from localStorage', () => {
      const token = makeJwt({ sub: faker.internet.username() });
      service.token = token;

      expect(service.token).toBe(token);
      expect(localStorage.getItem('token')).toBe(token);
    });

    it('returns empty string when no token stored', () => {
      expect(service.token).toBe('');
    });
  });

  describe('tokenExpirationDate', () => {
    it('returns date from exp claim', () => {
      const expSeconds = faker.number.int({ min: 1_700_000_000, max: 2_000_000_000 });
      service.token = makeJwt({ exp: expSeconds });

      expect(service.tokenExpirationDate.getTime()).toBe(expSeconds * 1000);
    });

    it('returns epoch 0 when no exp claim', () => {
      service.token = makeJwt({ sub: 'user' });

      expect(service.tokenExpirationDate.getTime()).toBe(0);
    });
  });

  describe('isTokenExpired()', () => {
    it('returns true for a past exp', () => {
      const pastExp = Math.floor(Date.now() / 1000) - faker.number.int({ min: 100, max: 10000 });
      service.token = makeJwt({ exp: pastExp });

      expect(service.isTokenExpired()).toBe(true);
    });

    it('returns false for a future exp', () => {
      const futureExp = Math.floor(Date.now() / 1000) + faker.number.int({ min: 3600, max: 86400 });
      service.token = makeJwt({ exp: futureExp });

      expect(service.isTokenExpired()).toBe(false);
    });
  });

  describe('shouldRenewToken', () => {
    it('returns true when token expires within 1 day', () => {
      const soonExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      service.token = makeJwt({ exp: soonExp });

      expect(service.shouldRenewToken).toBe(true);
    });

    it('returns false when token expires in more than 1 day', () => {
      const laterExp = Math.floor(Date.now() / 1000) + 86400 * 3; // 3 days from now
      service.token = makeJwt({ exp: laterExp });

      expect(service.shouldRenewToken).toBe(false);
    });
  });

  describe('OAuth URL builders', () => {
    it('getDiscordAuthUri contains discord client id', () => {
      const url = service.getDiscordAuthUri();

      expect(url).toContain(service.getDiscordClientId());
      expect(url).toContain('discord.com/oauth2/authorize');
    });

    it('getTwitchAuthUrl contains twitch client id', () => {
      const url = service.getTwitchAuthUrl();

      expect(url).toContain(service.getTwitchClientId());
      expect(url).toContain('id.twitch.tv/oauth2/authorize');
    });

    it('getTwitterAuthUrl contains twitter client id', () => {
      const url = service.getTwitterAuthUrl();

      expect(url).toContain(service.getTwitterClientId());
      expect(url).toContain('twitter.com/i/oauth2/authorize');
    });

    it('sync=true uses sync redirect URI', () => {
      const syncUrl = service.getDiscordAuthUri(true);
      const loginUrl = service.getDiscordAuthUri(false);

      expect(syncUrl).toContain('sync');
      expect(loginUrl).toContain('login');
    });
  });
});
