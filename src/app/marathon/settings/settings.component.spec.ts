import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { faker } from '@faker-js/faker';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { SettingsComponent } from './settings.component';
import { TranslateTestingModule, makeMarathon, makeUser } from '../../../testing';
import { MarathonService } from '../../../services/marathon.service';
import { UserService } from '../../../services/user.service';
import { NotificationService } from '../../../services/notification.service';
import { Question } from '../../../model/question';

describe('SettingsComponent (marathon)', () => {
  let fixture: ComponentFixture<SettingsComponent>;
  let component: SettingsComponent;
  let marathonServiceStub: Record<string, any>;

  beforeEach(async () => {
    const settings = {
      id: faker.string.alphanumeric(8),
      defaultSetupTime: 'PT10M',
      webhook: '',
    };

    marathonServiceStub = {
      marathon: makeMarathon({ creator: { id: 1, username: 'owner' } as any }),
      updateSettings: vi.fn().mockReturnValue(of(settings)),
      updateQuestions: vi.fn().mockReturnValue(of(null)),
      updateModerators: vi.fn().mockReturnValue(of(null)),
    };

    await TestBed.configureTestingModule({
      imports: [SettingsComponent, TranslateTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({
              settings: { ...settings, defaultSetupTime: 'PT10M' },
              questions: [],
              moderators: [],
            }),
          },
        },
        { provide: MarathonService, useValue: marathonServiceStub },
        { provide: UserService, useValue: { user: makeUser({ id: 1 }) } },
        { provide: NotificationService, useValue: { toast: vi.fn(), toastRaw: vi.fn() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(SettingsComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });
  it('ngOnInit populates settings from route data', () => {
    expect(component.settings).toBeDefined();
    expect(component.settings.defaultSetupTimeHuman).toBe('00:10:00');
  });

  it('active defaults to general', () => {
    expect(component.active).toBe('general');
  });

  it('settingsComponentUpdated sets settingsValid', () => {
    component.settingsComponentUpdated(false);

    expect(component.settingsValid).toBe(false);
  });

  it('addQuestion adds to submissionsQuestions for SUBMISSION type', () => {
    component.submissionsQuestions = [];

    component.addQuestion({ questionType: 'SUBMISSION' });

    expect(component.submissionsQuestions).toHaveLength(1);
    expect(component.submissionsQuestions[0].type).toBe('SUBMISSION');
  });

  it('addQuestion adds to donationsQuestions for DONATION type', () => {
    component.donationsQuestions = [];

    component.addQuestion({ questionType: 'DONATION' });

    expect(component.donationsQuestions).toHaveLength(1);
    expect(component.donationsQuestions[0].type).toBe('DONATION');
  });

  it('removeQuestion removes from submissionsQuestions by index', () => {
    const q: Question = { id: 1, label: 'test', description: '', fieldType: 'TEXT', options: [], position: 0, required: false, type: 'SUBMISSION' };
    component.submissionsQuestions = [q];

    component.removeQuestion({ questionType: 'SUBMISSION', i: 0 });

    expect(component.submissionsQuestions).toHaveLength(0);
  });

  it('removeQuestion removes from donationsQuestions by index', () => {
    const q: Question = { id: 1, label: 'test', description: '', fieldType: 'TEXT', options: [], position: 0, required: false, type: 'DONATION' };
    component.donationsQuestions = [q];

    component.removeQuestion({ questionType: 'DONATION', i: 0 });

    expect(component.donationsQuestions).toHaveLength(0);
  });

  it('computeQuestionsPositions updates position fields', () => {
    const q1: Question = { id: 1, label: '', description: '', fieldType: 'TEXT', options: [], position: 99, required: false, type: 'SUBMISSION' };
    const q2: Question = { id: 2, label: '', description: '', fieldType: 'TEXT', options: [], position: 99, required: false, type: 'SUBMISSION' };
    component.submissionsQuestions = [q1, q2];

    component.computeQuestionsPositions();

    expect(q1.position).toBe(0);
    expect(q2.position).toBe(1);
  });

  it('addOption adds empty option to question', () => {
    const q: Question = { id: 1, label: '', description: '', fieldType: 'SELECT', options: ['a'], position: 0, required: false, type: 'SUBMISSION' };
    component.submissionsQuestions = [q];

    component.addOption({ questionType: 'SUBMISSION', i: 0 });

    expect(q.options).toHaveLength(2);
    expect(q.options[1]).toBe('');
  });

  it('questionTypeChange sets required false when fieldType is FREETEXT', () => {
    const q: Question = { id: 1, label: '', description: '', fieldType: 'FREETEXT', options: [], position: 0, required: true, type: 'SUBMISSION' };
    component.submissionsQuestions = [q];

    component.questionTypeChange({ questionType: 'SUBMISSION', i: 0, fieldType: 'FREETEXT' });

    expect(q.required).toBe(false);
  });
});
