import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { faker } from '@faker-js/faker';
import { Subject } from 'rxjs';
import { SubmissionLazyLoaderComponent } from './submission-lazy-loader.component';
import { TranslateTestingModule, makeMarathon } from '../../../../testing';
import { MarathonService } from '../../../../services/marathon.service';
import { SubmissionPage } from '../../../../model/submission-page';
import { Submission } from '../../../../model/submission';
import { Game } from '../../../../model/game';
import { Category } from '../../../../model/category';

class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(_cb: any, _opts?: any) {}
}
vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

describe('SubmissionLazyLoaderComponent', () => {
  let fixture: ComponentFixture<SubmissionLazyLoaderComponent>;
  let component: SubmissionLazyLoaderComponent;
  let nextPageSubject: Subject<SubmissionPage>;

  beforeEach(async () => {
    nextPageSubject = new Subject<SubmissionPage>();

    await TestBed.configureTestingModule({
      imports: [SubmissionLazyLoaderComponent, TranslateTestingModule],
      providers: [
        { provide: MarathonService, useValue: { marathon: makeMarathon() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(SubmissionLazyLoaderComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(SubmissionLazyLoaderComponent);
    component = fixture.componentInstance;
    component.nextSubmissionPage = nextPageSubject;
    component.doInitialLoad = false;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('submissions$ starts empty', () => {
    expect(component.submissions$.getValue()).toEqual([]);
  });

  it('canLoadMore defaults to true', () => {
    expect(component.canLoadMore).toBe(true);
  });

  it('resetLoadedSubmissions clears submissions and resets state', () => {
    component.submissions$.next([new Submission()]);
    (component as any).lastPageLoaded = 5;

    component.resetLoadedSubmissions();

    expect(component.submissions$.getValue()).toEqual([]);
    expect((component as any).lastPageLoaded).toBe(0);
    expect(component.canLoadMore).toBe(true);
  });

  it('deleteSubmissionFromList removes submission by id', () => {
    const sub1 = new Submission();
    sub1.id = faker.number.int({ min: 1, max: 100 });
    const sub2 = new Submission();
    sub2.id = faker.number.int({ min: 101, max: 200 });
    component.submissions$.next([sub1, sub2]);

    component.deleteSubmissionFromList(sub1.id);

    expect(component.submissions$.getValue()).toHaveLength(1);
    expect(component.submissions$.getValue()[0].id).toBe(sub2.id);
  });

  it('deleteGameFromList removes game from all submissions', () => {
    const gameId = faker.number.int();
    const game = new Game();
    game.id = gameId;
    game.categories = [new Category()];
    const sub = new Submission();
    sub.games = [game];
    component.submissions$.next([sub]);

    component.deleteGameFromList(gameId);

    expect(component.submissions$.getValue()[0].games).toHaveLength(0);
  });

  it('deleteCategoryFromList removes category and emits', () => {
    const gameId = faker.number.int();
    const catId = faker.number.int();
    const category = new Category();
    category.id = catId;
    const game = new Game();
    game.id = gameId;
    game.categories = [category, new Category()];
    const sub = new Submission();
    sub.games = [game];
    component.submissions$.next([sub]);

    let emitted: number | undefined;
    component['deleteCategory'].subscribe((v: number) => (emitted = v));

    component.deleteCategoryFromList(gameId, catId);

    expect(game.categories).toHaveLength(1);
    expect(emitted).toBe(catId);
  });

  it('deleteCategoryFromList removes game when last category deleted', () => {
    const gameId = faker.number.int();
    const catId = faker.number.int();
    const category = new Category();
    category.id = catId;
    const game = new Game();
    game.id = gameId;
    game.categories = [category];
    const sub = new Submission();
    sub.games = [game];
    component.submissions$.next([sub]);

    component.deleteCategoryFromList(gameId, catId);

    expect(component.submissions$.getValue()[0].games).toHaveLength(0);
  });
});
