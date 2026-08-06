import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { SelectionComponent } from './selection.component';
import { TranslateTestingModule, makeMarathon } from '../../../testing';
import { MarathonService } from '../../../services/marathon.service';
import { SelectionService } from '../../../services/selection.service';
import { SubmissionService } from '../../../services/submission.service';
import { TemporalServiceService } from '../../../services/termporal/temporal-service.service';

vi.mock('vis-timeline/esnext', () => {
  const DS = class { add = vi.fn(); remove = vi.fn(); clear = vi.fn(); get = vi.fn().mockReturnValue([]); getIds = vi.fn().mockReturnValue([]); flush = vi.fn(); };
  return { DataSet: DS, Timeline: class { destroy = vi.fn(); } };
});

vi.mock('vis-data', () => {
  const DS = class { add = vi.fn(); remove = vi.fn(); clear = vi.fn(); get = vi.fn().mockReturnValue([]); getIds = vi.fn().mockReturnValue([]); flush = vi.fn(); };
  return { DataSet: DS };
});

describe('SelectionComponent', () => {
  let fixture: ComponentFixture<SelectionComponent>;
  let component: SelectionComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectionComponent, TranslateTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: { selection: {} },
              parent: { paramMap: { get: () => 'test-marathon' } },
            },
          },
        },
        { provide: MarathonService, useValue: { marathon: makeMarathon({ defaultSetupTime: 'PT10M' }) } },
        { provide: SelectionService, useValue: { getAllForMarathonAdmin: vi.fn().mockReturnValue(of({})), save: vi.fn().mockReturnValue({ add: vi.fn() }) } },
        { provide: SubmissionService, useValue: { loadAllSubmissions: vi.fn().mockResolvedValue([]), availabilitiesForUser: vi.fn().mockReturnValue(of({})) } },
        { provide: TemporalServiceService, useValue: { parseDate: vi.fn(), now: Temporal.Now.zonedDateTimeISO() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(SelectionComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(SelectionComponent);
    component = fixture.componentInstance;
  });
  describe('getSelectColor', () => {
    it('returns is-warning for TODO', () => {
      expect(component.getSelectColor('TODO')).toBe('is-warning');
    });

    it('returns is-danger for REJECTED', () => {
      expect(component.getSelectColor('REJECTED')).toBe('is-danger');
    });

    it('returns is-info for BONUS', () => {
      expect(component.getSelectColor('BONUS')).toBe('is-info');
    });

    it('returns is-primary for BACKUP', () => {
      expect(component.getSelectColor('BACKUP')).toBe('is-primary');
    });

    it('returns is-success for VALIDATED', () => {
      expect(component.getSelectColor('VALIDATED')).toBe('is-success');
    });
  });

  it('canPublish returns true when no TODO selections', () => {
    component.selection = { '1': { status: 'VALIDATED', categoryId: 1 } as any };

    expect(component.canPublish()).toBe(true);
  });

  it('canPublish returns false when TODO selections exist', () => {
    component.selection = { '1': { status: 'TODO', categoryId: 1 } as any };

    expect(component.canPublish()).toBe(false);
  });

  it('setTodoToDeclined changes all TODO to REJECTED', () => {
    component.selection = {
      '1': { status: 'TODO', categoryId: 1 } as any,
      '2': { status: 'VALIDATED', categoryId: 2 } as any,
      '3': { status: 'TODO', categoryId: 3 } as any,
    };

    component.setTodoToDeclined();

    expect(component.selection['1'].status).toBe('REJECTED');
    expect(component.selection['2'].status).toBe('VALIDATED');
    expect(component.selection['3'].status).toBe('REJECTED');
  });

  it('getNumberOfRuns returns count of selection keys', () => {
    component.selection = { '1': {} as any, '2': {} as any };

    expect(component.getNumberOfRuns()).toBe(2);
  });

  it('marathonId returns lowercase marathon id', () => {
    expect(component.marathonId).toBe(component.marathonId.toLowerCase());
  });
});
