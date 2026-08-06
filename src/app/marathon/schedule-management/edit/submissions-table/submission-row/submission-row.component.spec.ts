import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SubmissionRowComponent } from './submission-row.component';
import { TranslateTestingModule, routerTestProviders } from '../../../../../../testing';

describe('SubmissionRowComponent', () => {
  let fixture: ComponentFixture<SubmissionRowComponent>;
  let component: SubmissionRowComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubmissionRowComponent, TranslateTestingModule],
      providers: [...routerTestProviders],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(SubmissionRowComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(SubmissionRowComponent);
    component = fixture.componentInstance;
  });
  it('selectedAvailabilities defaults to empty array', () => {
    expect(component.selectedAvailabilities).toEqual([]);
  });

  it('moveToSchedule emits index', () => {
    let emitted: number | undefined;
    component.moveToSchedule.subscribe((v: number) => (emitted = v));

    component.moveToSchedule.emit(0);

    expect(emitted).toBe(0);
  });
});
