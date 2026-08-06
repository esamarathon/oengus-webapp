import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SubmissionComponent } from './submission.component';
import { TranslateTestingModule, routerTestProviders, makeHistoryGameCategory, makeHistoryGame, makeUserProfileHistory } from '../../../../../testing';

describe('SubmissionComponent', () => {
  let fixture: ComponentFixture<SubmissionComponent>;
  let component: SubmissionComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubmissionComponent, TranslateTestingModule],
      providers: [...routerTestProviders],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SubmissionComponent);
    component = fixture.componentInstance;
    component.submissions = [];
  });
  describe('getSpan', () => {
    it('returns span count for a marathon element', () => {
      const cat1 = makeHistoryGameCategory();
      const cat2 = makeHistoryGameCategory();
      const history = makeUserProfileHistory({ games: [makeHistoryGame({ categories: [cat1, cat2] })] });

      expect(component.getSpan(history)).toBe('span 2');
    });

    it('returns span count for a game element', () => {
      const game = makeHistoryGame({ categories: [makeHistoryGameCategory(), makeHistoryGameCategory(), makeHistoryGameCategory()] });
      expect(component.getSpan(game)).toBe('span 3');
    });

    it('returns span 1 for a single category', () => {
      const cat = makeHistoryGameCategory();
      expect(component.getSpan(cat)).toBe('span 1');
    });
  });

  describe('getCellColor', () => {
    it('returns is-info for VALIDATED status', () => {
      const cat = makeHistoryGameCategory({ status: 'VALIDATED' });
      expect(component.getCellColor(cat)).toEqual({
        'is-info': true,
        'is-primary': false,
        'is-success': false,
        'is-warning': false,
      });
    });

    it('returns is-primary for BONUS status', () => {
      const cat = makeHistoryGameCategory({ status: 'BONUS' });
      expect(component.getCellColor(cat)).toEqual({
        'is-info': false,
        'is-primary': true,
        'is-success': false,
        'is-warning': false,
      });
    });

    it('returns is-success for BACKUP status', () => {
      const cat = makeHistoryGameCategory({ status: 'BACKUP' });
      expect(component.getCellColor(cat)).toEqual({
        'is-info': false,
        'is-primary': false,
        'is-success': true,
        'is-warning': false,
      });
    });

    it('returns is-warning for REJECTED status', () => {
      const cat = makeHistoryGameCategory({ status: 'REJECTED' });
      expect(component.getCellColor(cat)).toEqual({
        'is-info': false,
        'is-primary': false,
        'is-success': false,
        'is-warning': true,
      });
    });

    it('uses minimum status when game has mixed statuses', () => {
      const game = makeHistoryGame({ categories: [makeHistoryGameCategory({ status: 'VALIDATED' }), makeHistoryGameCategory({ status: 'REJECTED' })] });
      const colors = component.getCellColor(game);
      expect(colors['is-info']).toBe(true);
    });
  });

  describe('type guards', () => {
    it('isMarathon returns true for marathon object', () => {
      expect(component.isMarathon(makeUserProfileHistory())).toBe(true);
    });

    it('isMarathon returns false for game object', () => {
      expect(component.isMarathon(makeHistoryGame())).toBe(false);
    });

    it('isGame returns true for game object', () => {
      expect(component.isGame(makeHistoryGame())).toBe(true);
    });

    it('isCategory returns true for category object', () => {
      expect(component.isCategory(makeHistoryGameCategory())).toBe(true);
    });

    it('isCategory returns false for game object', () => {
      expect(component.isCategory(makeHistoryGame())).toBe(false);
    });
  });
});
