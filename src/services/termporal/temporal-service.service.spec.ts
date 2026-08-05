import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { faker } from '@faker-js/faker';
import { TemporalServiceService } from './temporal-service.service';

describe('TemporalServiceService', () => {
  let service: TemporalServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TemporalServiceService],
    });
    service = TestBed.inject(TemporalServiceService);
  });

  describe('locale', () => {
    it('defaults to en-GB', () => {
      expect(service.locale).toBe('en-GB');
    });

    it('changes locale', () => {
      const locale = faker.helpers.arrayElement(['fr', 'de', 'ja', 'nl']);
      service.changeLocale(locale);

      expect(service.locale).toBe(locale);
    });
  });

  describe('now', () => {
    it('returns a ZonedDateTime close to current time', () => {
      const now = service.now;

      expect(now).toBeDefined();
      const diffMs = Math.abs(now.epochMilliseconds - Date.now());
      expect(diffMs).toBeLessThan(1000);
    });
  });

  describe('parseDate()', () => {
    it('parses an ISO string to ZonedDateTime', () => {
      const instant = Temporal.Now.instant();
      const isoString = instant.toString();

      const result = service.parseDate(isoString);

      expect(result.epochMilliseconds).toBe(instant.epochMilliseconds);
    });

    it('parses epoch milliseconds to ZonedDateTime', () => {
      const epochMs = faker.number.int({ min: 1_700_000_000_000, max: 1_800_000_000_000 });

      const result = service.parseDate(epochMs);

      expect(result.epochMilliseconds).toBe(epochMs);
    });

    it('returns the same ZonedDateTime if already one', () => {
      const zdt = Temporal.Now.zonedDateTimeISO();

      const result = service.parseDate(zdt);

      expect(result).toBe(zdt);
    });
  });

  describe('timeZone', () => {
    it('returns a valid IANA timezone string', () => {
      const tz = service.timeZone.timeZone;

      expect(tz).toBeDefined();
      expect(tz.length).toBeGreaterThan(0);
      // Should not throw when used with Temporal
      expect(() => Temporal.Now.zonedDateTimeISO(tz)).not.toThrow();
    });
  });
});
