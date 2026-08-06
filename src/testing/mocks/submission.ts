import { faker } from '@faker-js/faker';
import { Submission } from '../../model/submission';
import { Game } from '../../model/game';
import { Category } from '../../model/category';
import { makeUser } from './user';

export function makeGame(overrides: Partial<Game> = {}): Game {
  const game = new Game();
  game.id = faker.number.int({ min: 1, max: 99999 });
  game.name = faker.commerce.productName();
  game.description = faker.lorem.sentence();
  game.console = faker.helpers.arrayElement(['PC', 'PS5', 'Switch', 'Xbox Series X', 'GBA', 'SNES']);
  game.visible = true;
  return Object.assign(game, overrides);
}

export function makeCategory(overrides: Partial<Category> = {}): Category {
  const category = new Category();
  category.id = faker.number.int({ min: 1, max: 99999 });
  category.name = faker.helpers.arrayElement(['Any%', '100%', 'All Bosses', 'Low%', 'Glitchless']);
  category.estimate = `PT${faker.number.int({ min: 1, max: 4 })}H${faker.number.int({ min: 0, max: 59 })}M`;
  category.video = faker.internet.url();
  category.visible = true;
  category.type = faker.helpers.arrayElement(['SINGLE', 'RACE', 'COOP'] as const);
  return Object.assign(category, overrides);
}

export function makeSubmission(overrides: Partial<Submission> = {}): Submission {
  const submission = new Submission();
  submission.id = faker.number.int({ min: 1, max: 99999 });
  submission.user = makeUser();
  submission.games = [makeGame()];
  return Object.assign(submission, overrides);
}
