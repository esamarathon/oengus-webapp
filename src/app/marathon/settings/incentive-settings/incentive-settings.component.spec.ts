import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { faker } from '@faker-js/faker';
import { IncentiveSettingsComponent } from './incentive-settings.component';
import { TranslateTestingModule, makeMarathon } from '../../../../testing';
import { Question } from '../../../../model/question';

describe('IncentiveSettingsComponent', () => {
  let fixture: ComponentFixture<IncentiveSettingsComponent>;
  let component: IncentiveSettingsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncentiveSettingsComponent, TranslateTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(IncentiveSettingsComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(IncentiveSettingsComponent);
    component = fixture.componentInstance;
    component.marathon = makeMarathon();
    component.donationsQuestions = [];
  });
  it('disabled defaults to undefined', () => {
    expect(component.disabled).toBeUndefined();
  });

  it('addQuestion emits with DONATION type', () => {
    let emitted: any;
    component.addQuestion.subscribe((v: any) => (emitted = v));

    component.addQuestion.emit({ questionType: 'DONATION' });

    expect(emitted).toEqual({ questionType: 'DONATION' });
  });

  it('removeQuestion emits with type and index', () => {
    let emitted: any;
    component.removeQuestion.subscribe((v: any) => (emitted = v));

    component.removeQuestion.emit({ questionType: 'DONATION', i: 2 });

    expect(emitted).toEqual({ questionType: 'DONATION', i: 2 });
  });
});
