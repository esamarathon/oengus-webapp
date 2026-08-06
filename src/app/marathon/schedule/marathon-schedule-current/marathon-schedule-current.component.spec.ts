import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MarathonScheduleCurrentComponent } from './marathon-schedule-current.component';
import { TranslateTestingModule, routerTestProviders } from '../../../../testing';
import { TemporalServiceService } from '../../../../services/termporal/temporal-service.service';

describe('MarathonScheduleCurrentComponent', () => {
  let fixture: ComponentFixture<MarathonScheduleCurrentComponent>;
  let component: MarathonScheduleCurrentComponent;

  beforeEach(async () => {
    const temporalStub = {
      now: Temporal.Now.zonedDateTimeISO(),
      distance: { format: vi.fn().mockReturnValue('in 5 minutes') },
    };

    await TestBed.configureTestingModule({
      imports: [MarathonScheduleCurrentComponent, TranslateTestingModule],
      providers: [
        ...routerTestProviders,
        { provide: TemporalServiceService, useValue: temporalStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(MarathonScheduleCurrentComponent);
    component = fixture.componentInstance;
  });
  describe('when isNext is false (current run)', () => {
    beforeEach(() => {
      component.isNext = false;
    });

    it('messageClass returns is-primary', () => {
      expect(component.messageClass).toBe('is-primary');
    });

    it('linkedRun returns current', () => {
      expect(component.linkedRun).toBe('current');
    });

    it('messageHeaderTitle returns currentRun key', () => {
      expect(component.messageHeaderTitle).toBe('marathon.schedule.currentRun');
    });

    it('messageHeaderArgs returns empty object', () => {
      expect(component.messageHeaderArgs).toEqual({});
    });
  });

  describe('when isNext is true (next run)', () => {
    beforeEach(() => {
      component.isNext = true;
      component.ticker = { date: Temporal.Now.zonedDateTimeISO() } as any;
    });

    it('messageClass returns empty string', () => {
      expect(component.messageClass).toBe('');
    });

    it('linkedRun returns next', () => {
      expect(component.linkedRun).toBe('next');
    });

    it('messageHeaderTitle returns nextRun key', () => {
      expect(component.messageHeaderTitle).toBe('marathon.schedule.nextRun');
    });

    it('messageHeaderArgs includes duration', () => {
      expect(component.messageHeaderArgs).toEqual({ duration: 'in 5 minutes' });
    });
  });
});
