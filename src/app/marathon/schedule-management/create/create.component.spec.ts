import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CreateComponent } from './create.component';
import { TranslateTestingModule } from '../../../../testing';
import { ScheduleService } from '../../../../services/schedule.service';
import { NotificationService } from '../../../../services/notification.service';

describe('CreateComponent (schedule-management)', () => {
  let fixture: ComponentFixture<CreateComponent>;
  let component: CreateComponent;
  let scheduleServiceStub: { createSchedule: ReturnType<typeof vi.fn> };
  let toastrStub: { toastRaw: ReturnType<typeof vi.fn> };
  let routerStub: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    scheduleServiceStub = { createSchedule: vi.fn() };
    toastrStub = { toastRaw: vi.fn() };
    routerStub = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [CreateComponent, TranslateTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { parent: { paramMap: { get: () => 'bsm2025' } } } } },
        { provide: Router, useValue: routerStub },
        { provide: ScheduleService, useValue: scheduleServiceStub },
        { provide: NotificationService, useValue: toastrStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateComponent);
    component = fixture.componentInstance;
  });
  it('reads marathonId from route snapshot', () => {
    expect(component.marathonId).toBe('bsm2025');
  });

  it('submit creates schedule and navigates on success', async () => {
    component.data = { name: 'Main Schedule', slug: 'MAIN' };
    scheduleServiceStub.createSchedule.mockReturnValue(of({ id: 42 }));

    await component.submit();

    expect(scheduleServiceStub.createSchedule).toHaveBeenCalledWith('bsm2025', { name: 'Main Schedule', slug: 'main' });
    expect(toastrStub.toastRaw).toHaveBeenCalledWith('Schedule created!', 5000);
    expect(routerStub.navigate).toHaveBeenCalledWith(['marathon', 'bsm2025', 'schedule-management', 42]);
    expect(component.loading).toBe(false);
  });

  it('submit shows permission warning on 401 error', async () => {
    component.data = { name: 'Extra', slug: 'extra' };
    scheduleServiceStub.createSchedule.mockReturnValue(throwError(() => ({ status: 401, message: 'Unauthorized' })));

    await component.submit();

    expect(toastrStub.toastRaw).toHaveBeenCalledWith(
      expect.stringContaining('don\'t have permission'),
      10000,
      'warning',
    );
    expect(component.loading).toBe(false);
  });

  it('submit shows generic error for other failures', async () => {
    component.data = { name: 'Extra', slug: 'extra' };
    scheduleServiceStub.createSchedule.mockReturnValue(throwError(() => ({ status: 500, message: 'Server error' })));

    await component.submit();

    expect(toastrStub.toastRaw).toHaveBeenCalledWith('Something went wrong: Server error', 5000, 'warning');
    expect(component.loading).toBe(false);
  });
});
