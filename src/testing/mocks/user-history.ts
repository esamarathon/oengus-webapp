import { faker } from '@faker-js/faker';
import { HistoryGame, HistoryGameCategory, HistoryMarathon, SavedCategory, SavedGame, UserProfileHistory } from '../../model/user-profile-history';

export function makeSavedCategory(overrides: Partial<SavedCategory> = {}): SavedCategory {
  return {
    id: faker.number.int({ min: 1, max: 99999 }),
    gameId: faker.number.int({ min: 1, max: 99999 }),
    name: faker.helpers.arrayElement(['Any%', '100%', 'Low%', 'Glitchless']),
    description: faker.lorem.sentence(),
    estimate: `PT${faker.number.int({ min: 1, max: 3 })}H${faker.number.int({ min: 0, max: 59 })}M`,
    video: faker.internet.url(),
    ...overrides,
  };
}

export function makeSavedGame(overrides: Partial<SavedGame> = {}): SavedGame {
  return {
    id: faker.number.int({ min: 1, max: 99999 }),
    name: faker.commerce.productName(),
    ratio: '16:9',
    description: faker.lorem.sentence(),
    console: faker.helpers.arrayElement(['PC', 'Switch', 'PS5', 'Xbox Series X']),
    emulated: false,
    categories: [makeSavedCategory()],
    ...overrides,
  };
}

export function makeHistoryGameCategory(overrides: Partial<HistoryGameCategory> = {}): HistoryGameCategory {
  return {
    code: null,
    description: faker.lorem.sentence(),
    estimate: `PT${faker.number.int({ min: 1, max: 3 })}H${faker.number.int({ min: 0, max: 59 })}M`,
    id: faker.number.int({ min: 1, max: 99999 }),
    name: faker.helpers.arrayElement(['Any%', '100%', 'All Bosses']),
    status: faker.helpers.arrayElement(['VALIDATED', 'BONUS', 'BACKUP', 'TODO', 'REJECTED'] as const),
    type: 'SINGLE',
    video: faker.internet.url(),
    ...overrides,
  };
}

export function makeHistoryGame(overrides: Partial<HistoryGame> = {}): HistoryGame {
  return {
    categories: [makeHistoryGameCategory()],
    console: faker.helpers.arrayElement(['PC', 'Switch', 'PS5']),
    description: faker.lorem.sentence(),
    emulated: false,
    id: faker.number.int({ min: 1, max: 99999 }),
    name: faker.commerce.productName(),
    ratio: '16:9',
    ...overrides,
  };
}

export function makeHistoryMarathon(): HistoryMarathon {
  return {
    marathonId: faker.string.alphanumeric(8),
    marathonName: faker.company.catchPhrase() + ' Marathon',
    marathonStartDate: Temporal.ZonedDateTime.from('2025-06-01T10:00:00+02:00[Europe/Amsterdam]'),
  };
}

export function makeUserProfileHistory(overrides: Partial<UserProfileHistory> = {}): UserProfileHistory {
  return {
    marathonId: faker.string.alphanumeric(8),
    marathonName: faker.company.catchPhrase() + ' Marathon',
    marathonStartDate: Temporal.ZonedDateTime.from('2025-03-15T12:00:00+01:00[Europe/Amsterdam]'),
    visible: true,
    games: [makeHistoryGame()],
    ...overrides,
  };
}
