import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { faker } from '@faker-js/faker';
import { of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DateTimeAdapter } from '@oengus/angular-datetime-picker';
import { SubmitComponent } from './submit.component';
import { TranslateTestingModule, makeMarathon, makeUser } from '../../../testing';
import { MarathonService } from '../../../services/marathon.service';
import { UserService } from '../../../services/user.service';
import { SubmissionService } from '../../../services/submission.service';
import { NotificationService } from '../../../services/notification.service';
import { TemporalServiceService } from '../../../services/termporal/temporal-service.service';
import { Submission } from '../../../model/submission';
import { Game } from '../../../model/game';
import { Category } from '../../../model/category';

describe('SubmitComponent', () => {
  let fixture: ComponentFixture<SubmitComponent>;
  let component: SubmitComponent;
  let marathonServiceStub: Record<string, any>;
  let userServiceStub: Record<string, any>;
  let submissionServiceStub: Record<string, any>;

  beforeEach(async () => {
    const marathon = makeMarathon({
      submitsOpen: false,
      maxGamesPerRunner: 5,
      maxCategoriesPerGame: 3,
      questions: [],
      discordRequired: false,
      discordPrivacy: false,
      hasSubmitted: false,
    });

    marathonServiceStub = {
      marathon,
      isArchived: vi.fn().mockReturnValue(false),
    };

    userServiceStub = {
      user: makeUser(),
      getSavedGamesList: vi.fn().mockReturnValue(of({ data: [] })),
    };

    submissionServiceStub = {
      create: vi.fn().mockReturnValue({ add: vi.fn() }),
      update: vi.fn().mockReturnValue({ add: vi.fn() }),
      delete: vi.fn(),
      mine: vi.fn().mockResolvedValue(null),
    };

    await TestBed.configureTestingModule({
      imports: [SubmitComponent, TranslateTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { data: {} } } },
        { provide: MarathonService, useValue: marathonServiceStub },
        { provide: UserService, useValue: userServiceStub },
        { provide: SubmissionService, useValue: submissionServiceStub },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: Location, useValue: { back: vi.fn() } },
        { provide: HttpClient, useValue: { get: vi.fn().mockReturnValue(of({})) } },
        { provide: NotificationService, useValue: { toast: vi.fn() } },
        { provide: TemporalServiceService, useValue: { timeZone: { timeZone: 'UTC' }, parseDate: vi.fn() } },
        { provide: DateTimeAdapter, useValue: { setLocale: vi.fn() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(SubmitComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(SubmitComponent);
    component = fixture.componentInstance;
  });
  it('maxCategoriesPerGame returns value from marathon', () => {
    marathonServiceStub.marathon.maxCategoriesPerGame = 4;

    expect(component.maxCategoriesPerGame).toBe(4);
  });

  it('gameNames returns comma-separated game names', () => {
    const game1 = new Game();
    game1.name = faker.commerce.productName();
    const game2 = new Game();
    game2.name = faker.commerce.productName();
    (component as any).submission.games = [game1, game2];

    expect(component.gameNames).toBe(`${game1.name},${game2.name}`);
  });

  it('discordRequired returns false when discordPrivacy is true', () => {
    marathonServiceStub.marathon.discordPrivacy = true;
    marathonServiceStub.marathon.discordRequired = true;

    expect(component.discordRequired).toBe(false);
  });

  it('discordRequired returns false when marathon discordRequired is false', () => {
    marathonServiceStub.marathon.discordPrivacy = false;
    marathonServiceStub.marathon.discordRequired = false;

    expect(component.discordRequired).toBe(false);
  });

  it('userHasDiscord returns true when user has discordId', () => {
    userServiceStub.user = makeUser({ discordId: faker.string.numeric(18) });

    expect(component.userHasDiscord).toBe(true);
  });

  it('userHasDiscord returns false when discordId is empty', () => {
    userServiceStub.user = makeUser({ discordId: '' });

    expect(component.userHasDiscord).toBe(false);
  });

  it('marathonDiscord returns discord invite URL', () => {
    marathonServiceStub.marathon.discord = 'abc123';

    expect(component.marathonDiscord).toBe('https://discord.gg/abc123');
  });

  it('addGame adds a new game with one category', () => {
    (component as any).submission.games = [];

    component.addGame();

    expect((component as any).submission.games).toHaveLength(1);
    expect((component as any).submission.games[0].id).toBe(-1);
    expect((component as any).submission.games[0].categories).toHaveLength(1);
  });

  it('addCategory adds a category to game at index', () => {
    const game = new Game();
    (component as any).submission.games = [game];

    component.addCategory(0);

    expect(game.categories).toHaveLength(1);
  });

  it('removeGame splices game at index', () => {
    const game1 = new Game();
    const game2 = new Game();
    (component as any).submission.games = [game1, game2];

    component.removeGame(0);

    expect((component as any).submission.games).toHaveLength(1);
    expect((component as any).submission.games[0]).toBe(game2);
  });

  it('removeCategory splices category at index', () => {
    const game = new Game();
    game.categories = [new Category(), new Category()];
    (component as any).submission.games = [game];

    component.removeCategory(0, 0);

    expect(game.categories).toHaveLength(1);
  });

  it('removeAvailability splices availability at index', () => {
    (component as any).submission.availabilities = [{ from: null, to: null }];

    component.removeAvailability(0);

    expect((component as any).submission.availabilities).toHaveLength(0);
  });

  it('addAvailability pushes a new empty availability', () => {
    (component as any).submission.availabilities = [];

    component.addAvailability();

    expect((component as any).submission.availabilities).toHaveLength(1);
  });

  it('goBack calls location.back', () => {
    const location = TestBed.inject(Location);

    component.goBack();

    expect(location.back).toHaveBeenCalled();
  });

  it('clickEmulatorButton toggles game emulated state', () => {
    const game = new Game();
    game.emulated = false;
    const event = { preventDefault: vi.fn(), stopPropagation: vi.fn() } as any;

    component.clickEmulatorButton(game, event);

    expect(game.emulated).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it('addOpponent pushes opponent to submission', () => {
    (component as any).submission.opponents = [];
    const opponent = { id: faker.number.int(), user: makeUser() } as any;

    component.addOpponent(opponent);

    expect((component as any).submission.opponents).toContain(opponent);
  });

  it('removeOpponent splices opponent at index', () => {
    const opp1 = { id: 1 };
    const opp2 = { id: 2 };
    (component as any).submission.opponents = [opp1, opp2];

    component.removeOpponent(0);

    expect((component as any).submission.opponents).toEqual([opp2]);
  });
});
