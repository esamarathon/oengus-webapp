import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ScheduleTableComponent } from './schedule-table.component';
import { TranslateTestingModule } from '../../../../../testing';
import { V2ScheduleLine } from '../../../../../model/schedule-line';

describe('ScheduleTableComponent', () => {
  let fixture: ComponentFixture<ScheduleTableComponent>;
  let component: ScheduleTableComponent;

  const makeLine = (overrides: Partial<V2ScheduleLine> = {}): V2ScheduleLine => ({
    id: 1,
    game: 'Test',
    category: 'Any%',
    console: 'PC',
    estimate: 'PT1H',
    setupTime: 'PT5M',
    runners: [],
    position: 0,
    customRun: false,
    setupBlock: false,
    setupBlockText: '',
    customData: '',
    emulated: false,
    ratio: '',
    type: 'SINGLE',
    categoryId: 1,
    date: Temporal.ZonedDateTime.from({ timeZone: 'UTC', year: 2025, month: 6, day: 15, hour: 10, minute: 0, second: 0 }),
    ...overrides,
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleTableComponent, TranslateTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(ScheduleTableComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(ScheduleTableComponent);
    component = fixture.componentInstance;
  });
  describe('shouldShowDay', () => {
    it('returns true for index 0', () => {
      component.lines = [makeLine()];

      expect(component.shouldShowDay(0)).toBe(true);
    });

    it('returns false when same day as previous', () => {
      const line1 = makeLine({ date: Temporal.ZonedDateTime.from({ timeZone: 'UTC', year: 2025, month: 6, day: 15, hour: 10, minute: 0, second: 0 }) });
      const line2 = makeLine({ date: Temporal.ZonedDateTime.from({ timeZone: 'UTC', year: 2025, month: 6, day: 15, hour: 14, minute: 0, second: 0 }) });
      component.lines = [line1, line2];

      expect(component.shouldShowDay(1)).toBe(false);
    });

    it('returns true when day changes', () => {
      const line1 = makeLine({ date: Temporal.ZonedDateTime.from({ timeZone: 'UTC', year: 2025, month: 6, day: 15, hour: 23, minute: 0, second: 0 }) });
      const line2 = makeLine({ date: Temporal.ZonedDateTime.from({ timeZone: 'UTC', year: 2025, month: 6, day: 16, hour: 1, minute: 0, second: 0 }) });
      component.lines = [line1, line2];

      expect(component.shouldShowDay(1)).toBe(true);
    });

    it('returns false for out-of-bounds index', () => {
      component.lines = [makeLine()];

      expect(component.shouldShowDay(5)).toBe(false);
    });
  });

  it('toggleExpand adds index to expanded set', () => {
    component.toggleExpand(3);

    expect(component.expanded.has(3)).toBe(true);
  });

  it('toggleExpand removes index when already expanded', () => {
    component.expanded.add(3);

    component.toggleExpand(3);

    expect(component.expanded.has(3)).toBe(false);
  });

  it('toggleExpand with openOnly does not close', () => {
    component.expanded.add(3);

    component.toggleExpand(3, true);

    expect(component.expanded.has(3)).toBe(true);
  });

  it('deleteRow removes from expanded and emits delete', () => {
    component.expanded.add(2);
    let emitted: number | undefined;
    component.delete.subscribe((v: number) => (emitted = v));

    component.deleteRow(2);

    expect(component.expanded.has(2)).toBe(false);
    expect(emitted).toBe(2);
  });
});
