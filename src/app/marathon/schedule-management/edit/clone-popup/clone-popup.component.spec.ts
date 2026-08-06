import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { faker } from '@faker-js/faker';
import { of } from 'rxjs';
import { ClonePopupComponent } from './clone-popup.component';
import { TranslateTestingModule, makeMarathon } from '../../../../../testing';
import { ScheduleService } from '../../../../../services/schedule.service';
import { MarathonService } from '../../../../../services/marathon.service';

describe('ClonePopupComponent', () => {
  let fixture: ComponentFixture<ClonePopupComponent>;
  let component: ClonePopupComponent;
  let scheduleServiceStub: Record<string, any>;

  beforeEach(async () => {
    scheduleServiceStub = {
      getAllOverview: vi.fn().mockReturnValue(of([
        { id: 1, name: 'Schedule A' },
        { id: 2, name: 'Schedule B' },
        { id: 3, name: 'Schedule C' },
      ])),
      getLines: vi.fn().mockReturnValue(of({ data: [] })),
      updateLines: vi.fn().mockReturnValue(of({ data: [] })),
    };

    await TestBed.configureTestingModule({
      imports: [ClonePopupComponent, TranslateTestingModule],
      providers: [
        { provide: ScheduleService, useValue: scheduleServiceStub },
        { provide: MarathonService, useValue: { marathon: makeMarathon() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(ClonePopupComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(ClonePopupComponent);
    component = fixture.componentInstance;
    component.selfId = 2;
    component.ngOnInit();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('open defaults to false', () => {
    expect(component.open).toBe(false);
  });

  it('cloneFromScheduleId defaults to -1', () => {
    expect(component.cloneFromScheduleId).toBe(-1);
  });

  it('openClonePopup sets open to true and loads schedules', () => {
    component.openClonePopup();

    expect(component.open).toBe(true);
    expect(component.loading).toBe(false);
    expect(component.schedules).toHaveLength(2);
    expect(component.schedules.every(s => s.id !== 2)).toBe(true);
  });

  it('cancelPopup resets state', () => {
    component.open = true;
    component.cloneFromScheduleId = 5;

    component.cancelPopup();

    expect(component.open).toBe(false);
    expect(component.cloneFromScheduleId).toBe(-1);
  });

  it('startImport returns early when cloneFromScheduleId is negative', async () => {
    component.cloneFromScheduleId = -1;

    await component.startImport();

    expect(scheduleServiceStub.getLines).not.toHaveBeenCalled();
  });
});
