import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { ScheduleComponent } from './schedule.component';
import { TranslateTestingModule, makeMarathon } from '../../../testing';
import { MarathonService } from '../../../services/marathon.service';
import { TemporalServiceService } from '../../../services/termporal/temporal-service.service';

describe('ScheduleComponent', () => {
  let fixture: ComponentFixture<ScheduleComponent>;
  let component: ScheduleComponent;
  let marathonServiceStub: Record<string, any>;
  let routerStub: Record<string, any>;

  const mockSchedule = {
    id: 1,
    lines: [
      {
        id: 1,
        game: 'Game A',
        estimate: 'PT1H',
        setupTime: 'PT5M',
        date: Temporal.ZonedDateTime.from({ timeZone: 'UTC', year: 2025, month: 6, day: 15, hour: 10, minute: 0, second: 0 }),
        setupBlock: false,
      },
      {
        id: 2,
        game: 'Game B',
        estimate: 'PT30M',
        setupTime: 'PT5M',
        date: Temporal.ZonedDateTime.from({ timeZone: 'UTC', year: 2025, month: 6, day: 15, hour: 11, minute: 5, second: 0 }),
        setupBlock: false,
      },
    ],
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T10:30:00Z'));

    marathonServiceStub = {
      marathon: makeMarathon({ scheduleDone: true }),
    };

    routerStub = {
      navigate: vi.fn(),
    };

    const now = Temporal.ZonedDateTime.from({ timeZone: 'UTC', year: 2025, month: 6, day: 15, hour: 10, minute: 30, second: 0 });

    await TestBed.configureTestingModule({
      imports: [ScheduleComponent, TranslateTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ schedule: mockSchedule }),
            fragment: of('run-1'),
          },
        },
        { provide: Router, useValue: routerStub },
        { provide: MarathonService, useValue: marathonServiceStub },
        { provide: TemporalServiceService, useValue: { now } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(ScheduleComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(ScheduleComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('schedule is populated from route data', () => {
    expect(component.schedule).toBe(mockSchedule);
  });

  it('runHash is set from route fragment', () => {
    expect(component.runHash).toBe('#run-1');
  });

  it('currentRun returns the run at currentIndex', () => {
    component.currentIndex = 0;

    expect(component.currentRun).toBe(mockSchedule.lines[0]);
  });

  it('currentRun returns null when currentIndex is undefined', () => {
    component.currentIndex = undefined;

    expect(component.currentRun).toBeNull();
  });

  it('nextRun returns first line when currentIndex is undefined', () => {
    component.currentIndex = undefined;

    expect(component.nextRun).toBe(mockSchedule.lines[0]);
  });

  it('nextRun returns line after currentIndex', () => {
    component.currentIndex = 0;

    expect(component.nextRun).toBe(mockSchedule.lines[1]);
  });

  it('nextRun returns null when currentIndex is last', () => {
    component.currentIndex = mockSchedule.lines.length - 1;

    expect(component.nextRun).toBeNull();
  });

  it('redirects when scheduleDone is false', async () => {
    marathonServiceStub.marathon.scheduleDone = false;

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ScheduleComponent, TranslateTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ schedule: mockSchedule }),
            fragment: of(null),
          },
        },
        { provide: Router, useValue: routerStub },
        { provide: MarathonService, useValue: marathonServiceStub },
        { provide: TemporalServiceService, useValue: { now: Temporal.Now.zonedDateTimeISO() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(ScheduleComponent, { set: { template: '' } })
      .compileComponents();

    TestBed.createComponent(ScheduleComponent);

    expect(routerStub.navigate).toHaveBeenCalledWith(['../'], expect.anything());
  });
});
