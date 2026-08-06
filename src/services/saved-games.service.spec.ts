import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { faker } from '@faker-js/faker';
import { SavedGamesService } from './saved-games.service';
import { NotificationService } from './notification.service';
import { makeSavedGame, makeSavedCategory } from '../testing';

describe('SavedGamesService', () => {
  let service: SavedGamesService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        SavedGamesService,
        { provide: NotificationService, useValue: { toastRaw: vi.fn() } },
      ],
    });
    service = TestBed.inject(SavedGamesService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('create()', () => {
    it('should POST a new saved game', () => {
      const game = makeSavedGame({ id: -1 });
      const created = { ...game, id: faker.number.int({ min: 1, max: 9999 }) };

      service.create(game).subscribe((result) => {
        expect(result.id).toBe(created.id);
      });

      const req = httpTesting.expectOne((r) => r.url.includes('/v2/users/@me/saved-games'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(game);
      req.flush(created);
    });
  });

  describe('update()', () => {
    it('should PATCH an existing game without categories', () => {
      const game = makeSavedGame({ id: 5 });
      const updated = { ...game, name: 'Updated Name' };

      service.update(game).subscribe((result) => {
        expect(result.name).toBe('Updated Name');
      });

      const req = httpTesting.expectOne((r) => r.url.includes('/v2/users/@me/saved-games/5'));
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body.categories).toBeUndefined();
      req.flush(updated);
    });
  });

  describe('delete()', () => {
    it('should DELETE a game by ID', () => {
      const gameId = faker.number.int({ min: 1, max: 9999 });

      service.delete(gameId).subscribe((result) => {
        expect(result.status).toBe(true);
      });

      const req = httpTesting.expectOne((r) => r.url.includes(`/v2/users/@me/saved-games/${gameId}`));
      expect(req.request.method).toBe('DELETE');
      req.flush({ status: true });
    });
  });

  describe('createCategory()', () => {
    it('should POST a category under a game', () => {
      const gameId = faker.number.int({ min: 1, max: 9999 });
      const category = makeSavedCategory({ id: -1 });
      const created = { ...category, id: faker.number.int({ min: 1, max: 9999 }) };

      service.createCategory(gameId, category).subscribe((result) => {
        expect(result.id).toBe(created.id);
      });

      const req = httpTesting.expectOne((r) => r.url.includes(`/v2/users/@me/saved-games/${gameId}`));
      expect(req.request.method).toBe('POST');
      req.flush(created);
    });
  });

  describe('updateCategory()', () => {
    it('should PATCH a category under a game', () => {
      const gameId = faker.number.int({ min: 1, max: 9999 });
      const category = makeSavedCategory({ id: 10 });
      const updated = { ...category, name: 'Updated' };

      service.updateCategory(gameId, category).subscribe((result) => {
        expect(result.name).toBe('Updated');
      });

      const req = httpTesting.expectOne((r) => r.url.includes(`/v2/users/@me/saved-games/${gameId}/${category.id}`));
      expect(req.request.method).toBe('PATCH');
      req.flush(updated);
    });
  });

  describe('deleteCategory()', () => {
    it('should DELETE a category by game and category ID', () => {
      const gameId = faker.number.int({ min: 1, max: 9999 });
      const categoryId = faker.number.int({ min: 1, max: 9999 });

      service.deleteCategory(gameId, categoryId).subscribe((result) => {
        expect(result.status).toBe(true);
      });

      const req = httpTesting.expectOne((r) => r.url.includes(`/v2/users/@me/saved-games/${gameId}/${categoryId}`));
      expect(req.request.method).toBe('DELETE');
      req.flush({ status: true });
    });
  });
});
