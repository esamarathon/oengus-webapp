import { describe, it, expect } from 'vitest';
import { faker } from '@faker-js/faker';
import { DurationService } from './duration.service';

describe('DurationService', () => {
  describe('toHuman()', () => {
    it('converts ISO duration to HH:MM:SS', () => {
      const h = faker.number.int({ min: 0, max: 23 });
      const m = faker.number.int({ min: 0, max: 59 });
      const s = faker.number.int({ min: 0, max: 59 });
      const iso = `PT${h}H${m}M${s}S`;

      const result = DurationService.toHuman(iso);

      const expected = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      expect(result).toBe(expected);
    });

    it('accepts a Temporal.Duration object', () => {
      const h = faker.number.int({ min: 1, max: 10 });
      const m = faker.number.int({ min: 0, max: 59 });
      const duration = Temporal.Duration.from({ hours: h, minutes: m, seconds: 0 });

      const result = DurationService.toHuman(duration);

      expect(result).toBe(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`);
    });

    it('returns empty string for empty input', () => {
      expect(DurationService.toHuman('')).toBe('');
    });
  });

  describe('toIso()', () => {
    it('converts HH:MM:SS to ISO duration', () => {
      const h = faker.number.int({ min: 0, max: 23 });
      const m = faker.number.int({ min: 0, max: 59 });
      const s = faker.number.int({ min: 0, max: 59 });
      const human = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

      const result = DurationService.toIso(human);
      const parsed = Temporal.Duration.from(result);

      expect(parsed.hours).toBe(h);
      expect(parsed.minutes).toBe(m);
      expect(parsed.seconds).toBe(s);
    });

    it('handles HH:MM format (no seconds)', () => {
      const h = faker.number.int({ min: 1, max: 10 });
      const m = faker.number.int({ min: 0, max: 59 });
      const human = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

      const result = DurationService.toIso(human);
      const parsed = Temporal.Duration.from(result);

      expect(parsed.hours).toBe(h);
      expect(parsed.minutes).toBe(m);
      expect(parsed.seconds).toBe(0);
    });

    it('returns empty string for empty input', () => {
      expect(DurationService.toIso('')).toBe('');
    });

    it('roundtrips with toHuman', () => {
      const h = faker.number.int({ min: 1, max: 12 });
      const m = faker.number.int({ min: 0, max: 59 });
      const s = faker.number.int({ min: 0, max: 59 });
      const human = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

      expect(DurationService.toHuman(DurationService.toIso(human))).toBe(human);
    });
  });
});
