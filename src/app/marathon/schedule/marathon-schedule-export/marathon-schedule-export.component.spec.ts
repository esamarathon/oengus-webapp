import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { MarathonScheduleExportComponent } from './marathon-schedule-export.component';
import { TranslateTestingModule, makeMarathon } from '../../../../testing';
import { ScheduleService } from '../../../../services/schedule.service';
import { MarathonService } from '../../../../services/marathon.service';
import { LoadingBarService } from '../../../../services/loading-bar.service';

describe('MarathonScheduleExportComponent', () => {
  let fixture: ComponentFixture<MarathonScheduleExportComponent>;
  let component: MarathonScheduleExportComponent;
  let scheduleServiceStub: { fetchExport: ReturnType<typeof vi.fn> };
  let loadingBarStub: { setLoading: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    scheduleServiceStub = { fetchExport: vi.fn() };
    loadingBarStub = { setLoading: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [MarathonScheduleExportComponent, TranslateTestingModule],
      providers: [
        { provide: ScheduleService, useValue: scheduleServiceStub },
        { provide: MarathonService, useValue: { marathon: makeMarathon({ id: 'bsm2025' }) } },
        { provide: LoadingBarService, useValue: loadingBarStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(MarathonScheduleExportComponent);
    component = fixture.componentInstance;
    component.scheduleId = 1;
    component.disabled = false;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('formats includes ics, csv, json, gdq', () => {
    expect(component.formats).toEqual(['ics', 'csv', 'json', 'gdq']);
  });

  it('runExport opens gdq tracker URL for gdq format', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const event = { preventDefault: vi.fn() } as unknown as Event;

    component.runExport('gdq', event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(openSpy).toHaveBeenCalledWith('https://github.com/oengusio/gdq-tracker-import', '_blank');
    openSpy.mockRestore();
  });

  it('runExport fetches export and triggers download for csv', () => {
    const blob = new Blob(['test'], { type: 'text/csv' });
    scheduleServiceStub.fetchExport.mockReturnValue(of(blob));
    const event = { preventDefault: vi.fn() } as unknown as Event;

    component.runExport('csv', event);

    expect(loadingBarStub.setLoading).toHaveBeenCalledWith(true);
    expect(scheduleServiceStub.fetchExport).toHaveBeenCalledWith('bsm2025', 1, 'csv');
    expect(loadingBarStub.setLoading).toHaveBeenCalledWith(false);
  });
});
