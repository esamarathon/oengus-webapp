import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SidebarTrackerComponent } from './sidebar-tracker.component';
import { TranslateTestingModule, makeMarathon } from '../../../../testing';

describe('SidebarTrackerComponent', () => {
  let fixture: ComponentFixture<SidebarTrackerComponent>;
  let component: SidebarTrackerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarTrackerComponent, TranslateTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarTrackerComponent);
    component = fixture.componentInstance;
    component.marathon = makeMarathon();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('marathonId returns the marathon id', () => {
    component.marathon = makeMarathon({ id: 'test-marathon' });
    expect(component.marathonId).toBe('test-marathon');
  });

  describe('acceptingDonations', () => {
    it('returns false when marathon is falsy', () => {
      component.marathon = undefined as any;
      expect(component.acceptingDonations).toBe(false);
    });

    it('returns false when hasDonations is false', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));

      component.marathon = makeMarathon({
        hasDonations: false,
        donationsOpen: true,
        startDate: Temporal.ZonedDateTime.from({ timeZone: 'UTC', year: 2025, month: 1, day: 1, hour: 0, minute: 0, second: 0 }),
        endDate: Temporal.ZonedDateTime.from({ timeZone: 'UTC', year: 2025, month: 12, day: 31, hour: 23, minute: 59, second: 59 }),
      });

      expect(component.acceptingDonations).toBe(false);
    });

    it('returns false when donationsOpen is false', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));

      component.marathon = makeMarathon({
        hasDonations: true,
        donationsOpen: false,
        startDate: Temporal.ZonedDateTime.from({ timeZone: 'UTC', year: 2025, month: 1, day: 1, hour: 0, minute: 0, second: 0 }),
        endDate: Temporal.ZonedDateTime.from({ timeZone: 'UTC', year: 2025, month: 12, day: 31, hour: 23, minute: 59, second: 59 }),
      });

      expect(component.acceptingDonations).toBe(false);
    });

    it('returns false when now is outside marathon timeframe', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2099-01-01T00:00:00Z'));

      component.marathon = makeMarathon({
        hasDonations: true,
        donationsOpen: true,
        startDate: Temporal.ZonedDateTime.from({ timeZone: 'UTC', year: 2025, month: 1, day: 1, hour: 0, minute: 0, second: 0 }),
        endDate: Temporal.ZonedDateTime.from({ timeZone: 'UTC', year: 2025, month: 12, day: 31, hour: 23, minute: 59, second: 59 }),
      });

      expect(component.acceptingDonations).toBe(false);
    });

    it('returns true when all conditions are met', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));

      component.marathon = makeMarathon({
        hasDonations: true,
        donationsOpen: true,
        startDate: Temporal.ZonedDateTime.from({ timeZone: 'UTC', year: 2025, month: 1, day: 1, hour: 0, minute: 0, second: 0 }),
        endDate: Temporal.ZonedDateTime.from({ timeZone: 'UTC', year: 2025, month: 12, day: 31, hour: 23, minute: 59, second: 59 }),
      });

      expect(component.acceptingDonations).toBe(true);
    });
  });
});
