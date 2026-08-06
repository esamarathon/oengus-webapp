import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { SavedGamesSettingsComponent } from './saved-games-settings.component';
import { TranslateTestingModule, makeSelfUser, makeSavedGame } from '../../../testing';
import { UserService } from '../../../services/user.service';
import { SavedGamesService } from '../../../services/saved-games.service';
import { SelfUser } from '../../../model/user';

describe('SavedGamesSettingsComponent', () => {
  let fixture: ComponentFixture<SavedGamesSettingsComponent>;
  let component: SavedGamesSettingsComponent;
  let selfUser: SelfUser;
  let userServiceStub: Record<string, any>;
  let savedGamesServiceStub: Record<string, any>;

  beforeEach(async () => {
    selfUser = makeSelfUser();

    userServiceStub = {
      getSupporterStatus: vi.fn().mockReturnValue(of({ anySupporter: true, sponsor: false, patreon: true })),
      getSavedGamesList: vi.fn().mockReturnValue(of({ data: [] })),
    };

    savedGamesServiceStub = {
      delete: vi.fn(),
      deleteCategory: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SavedGamesSettingsComponent, TranslateTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { data: { user: selfUser } } } },
        { provide: UserService, useValue: userServiceStub },
        { provide: SavedGamesService, useValue: savedGamesServiceStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(SavedGamesSettingsComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(SavedGamesSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });
  it('fetches supporter status on init', () => {
    expect(component.isSupporter).toBe(true);
  });

  it('addGame appends a new empty game with one category', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0);

    component.addGame();

    expect(component.games).toHaveLength(1);
    expect(component.games[0].id).toBe(-1);
    expect(component.games[0].categories).toHaveLength(1);
  });

  it('addCategory appends an empty category to specified game', () => {
    component.games = [makeSavedGame({ categories: [] })];
    component.addCategory(0, false);

    expect(component.games[0].categories).toHaveLength(1);
    expect(component.games[0].categories[0].id).toBe(-1);
  });

  it('removeGame splices game when id < 1 (no API call)', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.games = [makeSavedGame({ id: -1, categories: [] }), makeSavedGame({ id: 5, categories: [] })];

    component.removeGame(0);

    expect(savedGamesServiceStub.delete).not.toHaveBeenCalled();
    expect(component.games).toHaveLength(1);
  });

  it('removeGame calls service delete when id > 0', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    savedGamesServiceStub.delete.mockReturnValue(of({ status: true }));
    const game = makeSavedGame({ id: 10, categories: [] });
    component.games = [game];

    component.removeGame(0);

    expect(savedGamesServiceStub.delete).toHaveBeenCalledWith(10);
    expect(component.games).toHaveLength(0);
  });

  it('removeGame does nothing when user cancels confirm', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.games = [makeSavedGame({ id: 5, categories: [] })];

    component.removeGame(0);

    expect(component.games).toHaveLength(1);
  });
});
