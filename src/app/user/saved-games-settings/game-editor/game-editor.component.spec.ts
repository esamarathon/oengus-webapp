import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { GameEditorComponent } from './game-editor.component';
import { TranslateTestingModule, makeSavedGame } from '../../../../testing';
import { SavedGamesService } from '../../../../services/saved-games.service';

describe('GameEditorComponent', () => {
  let fixture: ComponentFixture<GameEditorComponent>;
  let component: GameEditorComponent;
  let savedGamesServiceStub: { create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    savedGamesServiceStub = {
      create: vi.fn(),
      update: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [GameEditorComponent, TranslateTestingModule],
      providers: [
        { provide: SavedGamesService, useValue: savedGamesServiceStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(GameEditorComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(GameEditorComponent);
    component = fixture.componentInstance;
  });
  it('sets editing to true for new games (id < 1)', async () => {
    component.inputGame = makeSavedGame({ id: -1 });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.editing).toBe(true);
  });

  it('sets editing to false for existing games', async () => {
    component.inputGame = makeSavedGame({ id: 5 });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.editing).toBe(false);
  });

  it('cancelEdit restores original game and exits editing', async () => {
    const original = makeSavedGame({ id: -1 });
    component.inputGame = original;
    fixture.detectChanges();
    await fixture.whenStable();

    component.game.name = 'Modified Name';
    (component as any).cancelEdit();

    expect(component.game.name).toBe(original.name);
    expect(component.editing).toBe(false);
  });

  it('saveGame creates new game when id < 1', async () => {
    const newGame = makeSavedGame({ id: -1 });
    const created = makeSavedGame({ id: 42 });
    component.inputGame = newGame;
    fixture.detectChanges();
    await fixture.whenStable();

    savedGamesServiceStub.create.mockReturnValue(of(created));
    const spy = vi.fn();
    component.gameChange.subscribe(spy);

    await component.saveGame();

    expect(savedGamesServiceStub.create).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(created);
    expect(component.editing).toBe(false);
    expect(component.loading).toBe(false);
  });

  it('saveGame updates existing game when id > 0', async () => {
    const existing = makeSavedGame({ id: 10 });
    const updated = { ...existing, name: 'Updated' };
    component.inputGame = existing;
    fixture.detectChanges();
    await fixture.whenStable();

    savedGamesServiceStub.update.mockReturnValue(of(updated));
    const spy = vi.fn();
    component.gameChange.subscribe(spy);

    await component.saveGame();

    expect(savedGamesServiceStub.update).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(updated);
    expect(component.editing).toBe(false);
  });
});
