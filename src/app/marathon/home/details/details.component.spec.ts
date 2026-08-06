import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DetailsComponent } from './details.component';
import { TranslateTestingModule, makeMarathon } from '../../../../testing';

describe('DetailsComponent', () => {
  let fixture: ComponentFixture<DetailsComponent>;
  let component: DetailsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailsComponent, TranslateTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DetailsComponent);
    component = fixture.componentInstance;
    component.marathon = makeMarathon();
  });

  afterEach(() => {
    vi.useRealTimers();
  });
  describe('isLive', () => {
    it('returns false when marathon is falsy', () => {
      component.marathon = undefined as any;
      expect(component.isLive).toBe(false);
    });

    it('returns true when now is between start and end', () => {
      const now = Date.now();
      vi.useFakeTimers();
      vi.setSystemTime(now);

      component.marathon = makeMarathon({
        startDate: Temporal.ZonedDateTime.from({ timeZone: 'UTC', year: 2020, month: 1, day: 1, hour: 0, minute: 0, second: 0 }),
        endDate: Temporal.ZonedDateTime.from({ timeZone: 'UTC', year: 2099, month: 12, day: 31, hour: 23, minute: 59, second: 59 }),
      });

      expect(component.isLive).toBe(true);
    });

    it('returns false when now is before start', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2020-01-01T00:00:00Z'));

      component.marathon = makeMarathon({
        startDate: Temporal.ZonedDateTime.from({ timeZone: 'UTC', year: 2099, month: 1, day: 1, hour: 0, minute: 0, second: 0 }),
        endDate: Temporal.ZonedDateTime.from({ timeZone: 'UTC', year: 2099, month: 12, day: 31, hour: 23, minute: 59, second: 59 }),
      });

      expect(component.isLive).toBe(false);
    });

    it('returns false when now is after end', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2099-01-01T00:00:00Z'));

      component.marathon = makeMarathon({
        startDate: Temporal.ZonedDateTime.from({ timeZone: 'UTC', year: 2020, month: 1, day: 1, hour: 0, minute: 0, second: 0 }),
        endDate: Temporal.ZonedDateTime.from({ timeZone: 'UTC', year: 2020, month: 12, day: 31, hour: 23, minute: 59, second: 59 }),
      });

      expect(component.isLive).toBe(false);
    });
  });

  describe('mastodonUrl', () => {
    it('returns default Oengus mastodon URL when marathon has no mastodon', () => {
      component.marathon = makeMarathon({ mastodon: '' });
      expect(component.mastodonUrl).toBe('https://mas.to/@OengusIO');
    });

    it('returns parsed mastodon URL with utm_source', () => {
      component.marathon = makeMarathon({ mastodon: 'duncte123@tech.lgbt' });
      expect(component.mastodonUrl).toBe('https://tech.lgbt/@duncte123?utm_source=Oengus');
    });
  });

  describe('bskyUrl', () => {
    it('returns empty string when no bluesky handle', () => {
      component.marathon = makeMarathon({ bluesky: '' });
      expect(component.bskyUrl).toBe('');
    });

    it('returns bluesky URL with utm_source', () => {
      component.marathon = makeMarathon({ bluesky: '@im.going-g.host' });
      expect(component.bskyUrl).toBe('https://bsky.app/profile/im.going-g.host?utm_source=Oengus');
    });
  });
});
