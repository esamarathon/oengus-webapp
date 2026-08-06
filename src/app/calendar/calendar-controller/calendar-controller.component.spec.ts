import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CalendarControllerComponent } from './calendar-controller.component';
import { TranslateTestingModule, routerTestProviders } from '../../../testing';

describe('CalendarControllerComponent', () => {
  let fixture: ComponentFixture<CalendarControllerComponent>;
  let component: CalendarControllerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarControllerComponent, TranslateTestingModule],
      providers: [...routerTestProviders],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarControllerComponent);
    component = fixture.componentInstance;
    component.year = 2025;
    component.month = 6;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  describe('previousCalendar', () => {
    it('decrements month within same year', () => {
      component.year = 2025;
      component.month = 6;
      expect(component.previousCalendar).toEqual({ year: 2025, month: 5 });
    });

    it('wraps to December of previous year from January', () => {
      component.year = 2025;
      component.month = 1;
      expect(component.previousCalendar).toEqual({ year: 2024, month: 12 });
    });
  });

  describe('nextCalendar', () => {
    it('increments month within same year', () => {
      component.year = 2025;
      component.month = 6;
      expect(component.nextCalendar).toEqual({ year: 2025, month: 7 });
    });

    it('wraps to January of next year from December', () => {
      component.year = 2025;
      component.month = 12;
      expect(component.nextCalendar).toEqual({ year: 2026, month: 1 });
    });
  });

  it('datetime returns a valid ISO date string', () => {
    component.year = 2025;
    component.month = 6;
    const date = new Date(component.datetime);
    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(5);
  });

  it('changeCalendarView emits new value', () => {
    const spy = vi.fn();
    component.calendarViewChange.subscribe(spy);

    component.changeCalendarView(true);

    expect(spy).toHaveBeenCalledWith(true);
  });
});
