import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { faker } from '@faker-js/faker';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { SubmissionsComponent } from './submissions.component';
import { TranslateTestingModule, makeMarathon, makeUser } from '../../../testing';
import { MarathonService } from '../../../services/marathon.service';
import { UserService } from '../../../services/user.service';
import { GameService } from '../../../services/game.service';
import { SubmissionService } from '../../../services/submission.service';
import { CategoryService } from '../../../services/category.service';

describe('SubmissionsComponent', () => {
  let fixture: ComponentFixture<SubmissionsComponent>;
  let component: SubmissionsComponent;
  let marathonServiceStub: Record<string, any>;
  let userServiceStub: Record<string, any>;
  let submissionServiceStub: Record<string, any>;
  let gameServiceStub: Record<string, any>;
  let categoryServiceStub: Record<string, any>;

  beforeEach(async () => {
    marathonServiceStub = {
      marathon: makeMarathon({ questions: [], selectionDone: false }),
      isAdmin: vi.fn().mockReturnValue(true),
    };

    userServiceStub = {
      user: makeUser(),
    };

    submissionServiceStub = {
      submissions: vi.fn().mockReturnValue(of({ content: [], empty: true, last: true })),
      searchSubmissions: vi.fn().mockReturnValue(of({ content: [], empty: true, last: true })),
      answers: vi.fn().mockReturnValue(of([])),
      delete: vi.fn(),
    };

    gameServiceStub = {
      exportAllForMarathon: vi.fn(),
      delete: vi.fn(),
    };

    categoryServiceStub = {
      delete: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SubmissionsComponent, TranslateTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { data: { selection: new Map() } } } },
        { provide: MarathonService, useValue: marathonServiceStub },
        { provide: UserService, useValue: userServiceStub },
        { provide: GameService, useValue: gameServiceStub },
        { provide: SubmissionService, useValue: submissionServiceStub },
        { provide: CategoryService, useValue: categoryServiceStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(SubmissionsComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(SubmissionsComponent);
    component = fixture.componentInstance;
  });
  it('active defaults to submissions', () => {
    expect(component.active).toBe('submissions');
  });

  it('isSearching returns false when no filters set', () => {
    component.gameFilter = '';
    component.statusFilter = '';

    expect(component.isSearching).toBe(false);
  });

  it('isSearching returns true when gameFilter is set', () => {
    component.gameFilter = faker.commerce.productName();

    expect(component.isSearching).toBe(true);
  });

  it('isSearching returns true when statusFilter is set', () => {
    component.statusFilter = 'VALIDATED';

    expect(component.isSearching).toBe(true);
  });

  it('showDelete returns true when selectionDone is false and user is admin', () => {
    marathonServiceStub.marathon.selectionDone = false;
    marathonServiceStub.isAdmin.mockReturnValue(true);

    expect(component.showDelete).toBe(true);
  });

  it('showDelete returns false when selectionDone is true', () => {
    marathonServiceStub.marathon.selectionDone = true;

    expect(component.showDelete).toBe(false);
  });

  it('userIsAdmin delegates to marathonService.isAdmin', () => {
    marathonServiceStub.isAdmin.mockReturnValue(false);

    expect(component.userIsAdmin).toBe(false);
  });

  it('displaysTabs returns true when admin and questions exist', () => {
    marathonServiceStub.marathon.questions = [{ id: 1, fieldType: 'TEXT', questionType: 'SUBMISSION' }];
    marathonServiceStub.isAdmin.mockReturnValue(true);

    expect(component.displaysTabs).toBe(true);
  });

  it('displaysTabs returns false when not admin', () => {
    marathonServiceStub.marathon.questions = [{ id: 1, fieldType: 'TEXT', questionType: 'SUBMISSION' }];
    marathonServiceStub.isAdmin.mockReturnValue(false);

    expect(component.displaysTabs).toBe(false);
  });

  it('switchTab changes active tab', () => {
    component.switchTab('answers');

    expect(component.active).toBe('answers');
  });

  it('switchTab to answers calls loadAnswers', () => {
    component.switchTab('answers');

    expect(submissionServiceStub.answers).toHaveBeenCalledWith(marathonServiceStub.marathon.id);
  });

  it('loadAnswers only loads once', () => {
    component.switchTab('answers');
    component.switchTab('answers');

    expect(submissionServiceStub.answers).toHaveBeenCalledTimes(1);
  });

  it('exportToCsv delegates to gameService', () => {
    component.exportToCsv();

    expect(gameServiceStub.exportAllForMarathon).toHaveBeenCalledWith(marathonServiceStub.marathon.id);
  });

  it('deleteSubmission delegates to submissionService', () => {
    const id = faker.number.int();

    component.deleteSubmission(id);

    expect(submissionServiceStub.delete).toHaveBeenCalledWith(marathonServiceStub.marathon.id, id);
  });

  it('deleteGame delegates to gameService', () => {
    const id = faker.number.int();

    component.deleteGame(id);

    expect(gameServiceStub.delete).toHaveBeenCalledWith(marathonServiceStub.marathon.id, id);
  });

  it('deleteCategory delegates to categoryService', () => {
    const id = faker.number.int();

    component.deleteCategory(id);

    expect(categoryServiceStub.delete).toHaveBeenCalledWith(marathonServiceStub.marathon.id, id);
  });

  it('ctrlFHandler returns true for non-ctrl+f keys', () => {
    const event = { ctrlKey: false, key: 'a' } as KeyboardEvent;

    expect(component.ctrlFHandler(event)).toBe(true);
  });
});
