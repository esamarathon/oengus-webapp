import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SubmissionCategoryComponent } from './submission-category.component';
import { TranslateTestingModule, makeMarathon, makeCategory } from '../../../../testing';

describe('SubmissionCategoryComponent', () => {
  let fixture: ComponentFixture<SubmissionCategoryComponent>;
  let component: SubmissionCategoryComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubmissionCategoryComponent, TranslateTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SubmissionCategoryComponent);
    component = fixture.componentInstance;
    component.marathon = makeMarathon();
    component.category = makeCategory();
    component.showDelete = false;
  });
  describe('safeStatus', () => {
    it('returns rawStatus when set', () => {
      component.rawStatus = 'VALIDATED';
      expect(component.safeStatus).toBe('VALIDATED');
    });

    it('returns TODO when rawStatus is empty', () => {
      component.rawStatus = '';
      expect(component.safeStatus).toBe('TODO');
    });
  });

  describe('ngOnInit status mapping', () => {
    it('maps VALIDATED to is-success', () => {
      component.rawStatus = 'VALIDATED';
      component.ngOnInit();
      expect(component.status).toBe('is-success');
    });

    it('maps REJECTED to is-danger', () => {
      component.rawStatus = 'REJECTED';
      component.ngOnInit();
      expect(component.status).toBe('is-danger');
    });

    it('maps BACKUP to is-primary', () => {
      component.rawStatus = 'BACKUP';
      component.ngOnInit();
      expect(component.status).toBe('is-primary');
    });

    it('maps BONUS to is-info', () => {
      component.rawStatus = 'BONUS';
      component.ngOnInit();
      expect(component.status).toBe('is-info');
    });

    it('maps unknown status to empty string', () => {
      component.rawStatus = 'TODO';
      component.ngOnInit();
      expect(component.status).toBe('');
    });
  });

  describe('waitingRunnerCount', () => {
    it('returns expected runners minus 1 minus opponents length', () => {
      const category = makeCategory();
      category.expectedRunnerCount = 4;
      category.opponents = [{ id: 1 }, { id: 2 }] as any[];
      component.category = category;

      expect(component.waitingRunnerCount).toBe(1);
    });
  });

  it('triggerDelete emits on call', () => {
    const spy = vi.fn();
    component.triggerDelete.subscribe(spy);

    component.triggerDelete.emit();

    expect(spy).toHaveBeenCalled();
  });
});
