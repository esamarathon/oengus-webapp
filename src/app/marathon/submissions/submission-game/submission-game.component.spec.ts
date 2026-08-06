import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SubmissionGameComponent } from './submission-game.component';
import { TranslateTestingModule, makeMarathon, makeGame, makeCategory } from '../../../../testing';

describe('SubmissionGameComponent', () => {
  let fixture: ComponentFixture<SubmissionGameComponent>;
  let component: SubmissionGameComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubmissionGameComponent, TranslateTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SubmissionGameComponent);
    component = fixture.componentInstance;
    component.marathon = makeMarathon({ selectionDone: false });
    component.game = makeGame();
    component.showDelete = false;
    component.userIsAdmin = false;
    component.selection = {} as any;
  });
  describe('getRawStatus', () => {
    it('returns empty string when selectionDone is false', () => {
      component.marathon = makeMarathon({ selectionDone: false });
      const cat = makeCategory();
      expect(component.getRawStatus(cat)).toBe('');
    });

    it('returns empty string when category has no selection', () => {
      component.marathon = makeMarathon({ selectionDone: true });
      const cat = makeCategory();
      cat.id = 99;
      component.selection = {} as any;
      expect(component.getRawStatus(cat)).toBe('');
    });

    it('returns status from selection map', () => {
      component.marathon = makeMarathon({ selectionDone: true });
      const cat = makeCategory();
      cat.id = 5;
      component.selection = { 5: { status: 'VALIDATED' } } as any;
      expect(component.getRawStatus(cat)).toBe('VALIDATED');
    });
  });

  describe('gameStatus', () => {
    it('returns empty string when selectionDone is false', () => {
      component.marathon = makeMarathon({ selectionDone: false });
      expect(component.gameStatus).toBe('');
    });

    it('returns validated when any category is VALIDATED', () => {
      component.marathon = makeMarathon({ selectionDone: true });
      const cat1 = makeCategory(); cat1.id = 1;
      const cat2 = makeCategory(); cat2.id = 2;
      component.game = makeGame();
      component.game.categories = [cat1, cat2];
      component.selection = { 1: { status: 'REJECTED' }, 2: { status: 'VALIDATED' } } as any;

      expect(component.gameStatus).toBe('validated');
    });

    it('returns bonus when highest is BONUS', () => {
      component.marathon = makeMarathon({ selectionDone: true });
      const cat1 = makeCategory(); cat1.id = 1;
      component.game = makeGame();
      component.game.categories = [cat1];
      component.selection = { 1: { status: 'BONUS' } } as any;

      expect(component.gameStatus).toBe('bonus');
    });

    it('returns backup when highest is BACKUP', () => {
      component.marathon = makeMarathon({ selectionDone: true });
      const cat1 = makeCategory(); cat1.id = 1;
      component.game = makeGame();
      component.game.categories = [cat1];
      component.selection = { 1: { status: 'BACKUP' } } as any;

      expect(component.gameStatus).toBe('backup');
    });

    it('returns rejected when all categories are rejected', () => {
      component.marathon = makeMarathon({ selectionDone: true });
      const cat1 = makeCategory(); cat1.id = 1;
      component.game = makeGame();
      component.game.categories = [cat1];
      component.selection = { 1: { status: 'REJECTED' } } as any;

      expect(component.gameStatus).toBe('rejected');
    });
  });

  it('deleteGame emits', () => {
    const spy = vi.fn();
    component.deleteGame.subscribe(spy);
    component.deleteGame.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('deleteCategory emits index', () => {
    const spy = vi.fn();
    component.deleteCategory.subscribe(spy);
    component.deleteCategory.emit(3);
    expect(spy).toHaveBeenCalledWith(3);
  });
});
