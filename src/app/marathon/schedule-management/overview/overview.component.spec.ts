import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { OverviewComponent } from './overview.component';
import { TranslateTestingModule, makeMarathon, makeBasicUserInfo, routerTestProviders } from '../../../../testing';
import { ScheduleService } from '../../../../services/schedule.service';
import { MarathonService } from '../../../../services/marathon.service';
import { UserService } from '../../../../services/user.service';
import { NotificationService } from '../../../../services/notification.service';
import { ScheduleInfo } from '../../../../model/schedule';

describe('OverviewComponent (schedule-management)', () => {
  let fixture: ComponentFixture<OverviewComponent>;
  let component: OverviewComponent;
  let scheduleServiceStub: { deleteById: ReturnType<typeof vi.fn> };
  let toastrStub: { toastRaw: ReturnType<typeof vi.fn> };
  const schedules: ScheduleInfo[] = [
    { id: 1, name: 'Main', slug: 'main', marathonId: 'bsm2025', published: true },
    { id: 2, name: 'Bonus', slug: 'bonus', marathonId: 'bsm2025', published: false },
  ];

  beforeEach(async () => {
    scheduleServiceStub = { deleteById: vi.fn().mockReturnValue(of(undefined)) };
    toastrStub = { toastRaw: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [OverviewComponent, TranslateTestingModule],
      providers: [
        ...routerTestProviders,
        { provide: ActivatedRoute, useValue: { snapshot: { data: { schedules: [...schedules] } } } },
        { provide: ScheduleService, useValue: scheduleServiceStub },
        { provide: MarathonService, useValue: { marathon: makeMarathon({ creator: makeBasicUserInfo({ id: 42 }) }) } },
        { provide: UserService, useValue: { getSupporterStatus: vi.fn().mockReturnValue(of({ anySupporter: true })) } },
        { provide: NotificationService, useValue: toastrStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(OverviewComponent);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('loads schedules from route data', () => {
    expect(component.schedules).toHaveLength(2);
    expect(component.schedules[0].name).toBe('Main');
  });

  it('isSponsor returns true when supporter', () => {
    expect(component.isSponsor).toBe(true);
  });

  it('maxScheduleCount returns 4 for sponsors', () => {
    expect(component.maxScheduleCount).toBe(4);
  });

  it('deleteSchedule removes schedule from list on confirm', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const schedule = component.schedules[0];
    component.deleteSchedule(schedule);

    expect(scheduleServiceStub.deleteById).toHaveBeenCalledWith('bsm2025', 1);
    expect(toastrStub.toastRaw).toHaveBeenCalledWith('Schedule deleted', 5000);
    expect(component.schedules).toHaveLength(1);
  });

  it('deleteSchedule does nothing on cancel', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    component.deleteSchedule(component.schedules[0]);

    expect(scheduleServiceStub.deleteById).not.toHaveBeenCalled();
    expect(component.schedules).toHaveLength(2);
  });
});
