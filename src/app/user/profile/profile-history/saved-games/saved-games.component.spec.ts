import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SavedGamesComponent } from './saved-games.component';
import { TranslateTestingModule, makeSavedGame, makeSavedCategory } from '../../../../../testing';

describe('SavedGamesComponent', () => {
  let fixture: ComponentFixture<SavedGamesComponent>;
  let component: SavedGamesComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SavedGamesComponent, TranslateTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SavedGamesComponent);
    component = fixture.componentInstance;
    component.games = [];
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('getSpan returns span based on category count', () => {
    const game = makeSavedGame({ categories: [makeSavedCategory(), makeSavedCategory(), makeSavedCategory()] });
    expect(component.getSpan(game)).toBe('span 3');
  });

  it('getSpan returns span 1 for single category', () => {
    const game = makeSavedGame();
    expect(component.getSpan(game)).toBe('span 1');
  });
});
