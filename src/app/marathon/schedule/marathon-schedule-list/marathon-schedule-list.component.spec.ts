import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MarathonScheduleListComponent } from './marathon-schedule-list.component';
import { TranslateTestingModule } from '../../../../testing';
import { V2ScheduleLine } from '../../../../model/schedule-line';

function makeLine(id: number, date: { year: number; month: number; day: number }): V2ScheduleLine {
  return {
    id,
    date: Temporal.ZonedDateTime.from({ timeZone: 'UTC', ...date, hour: 12, minute: 0, second: 0 }),
  } as any;
}

describe('MarathonScheduleListComponent', () => {
  let fixture: ComponentFixture<MarathonScheduleListComponent>;
  let component: MarathonScheduleListComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarathonScheduleListComponent, TranslateTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(MarathonScheduleListComponent);
    component = fixture.componentInstance;
    component.runs = [
      makeLine(1, { year: 2025, month: 6, day: 15 }),
      makeLine(2, { year: 2025, month: 6, day: 15 }),
      makeLine(3, { year: 2025, month: 6, day: 16 }),
    ];
    component.currentRun = null;
    component.nextRun = null;
    component.runHash = '';
  });

  afterEach(() => {
    vi.useRealTimers();
  });
  describe('shouldShowDay', () => {
    it('returns true for index 0', () => {
      expect(component.shouldShowDay(0)).toBe(true);
    });

    it('returns false when same day as previous', () => {
      expect(component.shouldShowDay(1)).toBe(false);
    });

    it('returns true when day changes', () => {
      expect(component.shouldShowDay(2)).toBe(true);
    });

    it('returns false for out-of-bounds index', () => {
      expect(component.shouldShowDay(99)).toBe(false);
    });
  });

  describe('getRowParity', () => {
    it('returns is-even for even index', () => {
      const result = component.getRowParity(0, component.runs[0]);
      expect(result['is-even']).toBe(true);
      expect(result['is-odd']).toBe(false);
    });

    it('returns is-odd for odd index', () => {
      const result = component.getRowParity(1, component.runs[1]);
      expect(result['is-even']).toBe(false);
      expect(result['is-odd']).toBe(true);
    });

    it('returns is-primary when run is the current run', () => {
      component.currentRun = component.runs[1];
      const result = component.getRowParity(1, component.runs[1]);
      expect(result['is-primary']).toBe(true);
    });
  });

  describe('getId', () => {
    it('returns run-{id}', () => {
      expect(component.getId(component.runs[0])).toBe('run-1');
    });
  });

  describe('getCurrentId / getNextId', () => {
    it('getCurrentId returns undefined when no current run', () => {
      expect(component.getCurrentId()).toBeUndefined();
    });

    it('getCurrentId returns run-{id} when set', () => {
      component.currentRun = component.runs[0];
      expect(component.getCurrentId()).toBe('run-1');
    });

    it('getNextId returns undefined when no next run', () => {
      expect(component.getNextId()).toBeUndefined();
    });

    it('getNextId returns run-{id} when set', () => {
      component.nextRun = component.runs[2];
      expect(component.getNextId()).toBe('run-3');
    });
  });

  describe('isBeforeCurrentRun', () => {
    it('returns false when no current run', () => {
      expect(component.isBeforeCurrentRun(component.runs[0])).toBe(false);
    });

    it('returns true when run is before current', () => {
      component.currentRun = component.runs[2];
      expect(component.isBeforeCurrentRun(component.runs[0])).toBe(true);
    });

    it('returns false when run is after current', () => {
      component.currentRun = component.runs[0];
      expect(component.isBeforeCurrentRun(component.runs[2])).toBe(false);
    });
  });

  describe('expandRunHash', () => {
    it('scrolls to run by id hash', () => {
      const spy = vi.spyOn(component, 'scrollToRun').mockImplementation(() => {});
      component.runHash = '#run-42';

      component.expandRunHash();

      expect(spy).toHaveBeenCalledWith(42);
    });

    it('scrolls to current run on #current', () => {
      const spy = vi.spyOn(component, 'scrollToRun').mockImplementation(() => {});
      component.currentRun = component.runs[1];
      component.runHash = '#current';

      component.expandRunHash();

      expect(spy).toHaveBeenCalledWith(2);
    });

    it('scrolls to next run on #next', () => {
      const spy = vi.spyOn(component, 'scrollToRun').mockImplementation(() => {});
      component.nextRun = component.runs[2];
      component.runHash = '#next';

      component.expandRunHash();

      expect(spy).toHaveBeenCalledWith(3);
    });

    it('does nothing when hash is empty', () => {
      const spy = vi.spyOn(component, 'scrollToRun').mockImplementation(() => {});
      component.runHash = '';

      component.expandRunHash();

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('copyLinkToClipboard', () => {
    it('copies link and shows popup', async () => {
      vi.useFakeTimers();
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: writeTextMock }, configurable: true });
      const event = { preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as Event;

      component.copyLinkToClipboard(42, event);
      await writeTextMock.mock.results[0].value;

      expect(event.preventDefault).toHaveBeenCalled();
      expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('#run-42'));
      expect(component.showCopiedPopup).toBe(42);

      vi.advanceTimersByTime(1000);
      expect(component.showCopiedPopup).toBeNull();
    });
  });
});
