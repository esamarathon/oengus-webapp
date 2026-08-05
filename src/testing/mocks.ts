import { faker } from '@faker-js/faker';
import { BasicUserInfo, SelfUser, User } from '../model/user';
import { Marathon, MarathonRaw, MarathonSettingsRawApi } from '../model/marathon';
import { Submission } from '../model/submission';
import { Game } from '../model/game';
import { Category } from '../model/category';

export function makeUser(overrides: Partial<User> = {}): User {
  const user = new User();
  user.id = faker.number.int({ min: 1, max: 99999 });
  user.username = faker.internet.username().toLowerCase();
  user.displayName = faker.person.fullName();
  user.email = faker.internet.email();
  user.enabled = true;
  user.emailVerified = true;
  user.roles = ['ROLE_USER'];
  user.country = faker.location.countryCode();
  user.languagesSpoken = faker.helpers.arrayElement(['en', 'fr', 'de', 'nl', 'ja']);
  return Object.assign(user, overrides);
}

export function makeBasicUserInfo(overrides: Partial<BasicUserInfo> = {}): BasicUserInfo {
  return {
    id: faker.number.int({ min: 1, max: 99999 }),
    username: faker.internet.username().toLowerCase(),
    displayName: faker.person.fullName(),
    ...overrides,
  };
}

export function makeSelfUser(overrides: Partial<SelfUser> = {}): SelfUser {
  return {
    id: faker.number.int({ min: 1, max: 99999 }),
    username: faker.internet.username().toLowerCase(),
    displayName: faker.person.fullName(),
    email: faker.internet.email(),
    pronouns: [faker.helpers.arrayElement(['he/him', 'she/her', 'they/them'])],
    languagesSpoken: [faker.helpers.arrayElement(['en', 'fr', 'de', 'nl', 'ja'])],
    country: faker.location.countryCode(),
    roles: ['ROLE_USER'],
    connections: [],
    enabled: true,
    mfaEnabled: false,
    emailVerified: true,
    discordId: '',
    twitchId: '',
    patreonId: '',
    createdAt: faker.date.past().toISOString(),
    lastLogin: faker.date.recent().toISOString(),
    savedGamesPublic: faker.datatype.boolean(),
    ...overrides,
  };
}

export function makeMarathon(overrides: Partial<Marathon> = {}): Marathon {
  const marathon = new Marathon();
  marathon.id = faker.string.alphanumeric(8).toLowerCase();
  marathon.name = faker.company.catchPhrase() + ' Marathon';
  marathon.creator = makeBasicUserInfo();
  marathon.language = faker.helpers.arrayElement(['en', 'fr', 'de', 'nl', 'ja']);
  marathon.country = faker.location.countryCode();
  marathon.maxGamesPerRunner = faker.number.int({ min: 1, max: 10 });
  marathon.maxCategoriesPerGame = faker.number.int({ min: 1, max: 5 });
  marathon.description = faker.lorem.paragraph();
  marathon.twitch = faker.internet.username().toLowerCase();
  marathon.discord = faker.string.alphanumeric(8);
  return Object.assign(marathon, overrides);
}

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

export function makeMarathonRaw(overrides: Partial<MarathonRaw> = {}): MarathonRaw {
  return {
    id: faker.string.alphanumeric(8).toLowerCase(),
    name: faker.company.catchPhrase() + ' Marathon',
    creator: makeBasicUserInfo(),
    startDate: faker.date.future().toISOString(),
    endDate: faker.date.future().toISOString(),
    submissionsStartDate: faker.date.future().toISOString(),
    submissionsEndDate: faker.date.future().toISOString(),
    description: faker.lorem.paragraph(),
    onsite: false,
    location: '',
    language: faker.helpers.arrayElement(['en', 'fr', 'de']),
    maxGamesPerRunner: faker.number.int({ min: 1, max: 10 }),
    maxCategoriesPerGame: faker.number.int({ min: 1, max: 5 }),
    hasMultiplayer: false,
    maxNumberOfScreens: 4,
    twitch: faker.internet.username().toLowerCase(),
    twitter: '',
    mastodon: '',
    bluesky: '',
    discord: faker.string.alphanumeric(8),
    youtube: '',
    country: faker.location.countryCode(),
    discordPrivacy: false,
    submitsOpen: true,
    moderators: [],
    defaultSetupTime: 'PT10M',
    defaultSetupTimeHuman: '10m',
    selectionDone: false,
    scheduleDone: false,
    isPrivate: false,
    hasIncentives: false,
    canEditSubmissions: true,
    questions: [],
    hasDonations: false,
    payee: '',
    donationCurrency: 'USD',
    supportedCharity: '',
    webhook: '',
    donationsTotal: 0,
    hasSubmitted: false,
    donationsOpen: false,
    videoRequired: true,
    unlimitedGames: false,
    unlimitedCategories: false,
    emulatorAuthorized: true,
    discordGuildId: '',
    discordGuildName: '',
    discordRequired: false,
    announceAcceptedSubmissions: true,
    ...overrides,
  };
}

export function makeMarathonSettingsRaw(overrides: Partial<MarathonSettingsRawApi> = {}): MarathonSettingsRawApi {
  return {
    id: faker.string.alphanumeric(8).toLowerCase(),
    name: faker.company.catchPhrase(),
    description: faker.lorem.sentence(),
    isPrivate: false,
    startDate: faker.date.future().toISOString(),
    endDate: faker.date.future().toISOString(),
    submissionsStartDate: faker.date.future().toISOString(),
    submissionsEndDate: faker.date.future().toISOString(),
    onsite: false,
    location: '',
    country: faker.location.countryCode(),
    language: 'en',
    unlimitedGames: false,
    unlimitedCategories: false,
    maxGamesPerRunner: 5,
    maxCategoriesPerGame: 3,
    allowMultiplayer: false,
    maxNumberOfScreens: 4,
    videoRequired: true,
    allowEmulators: true,
    discordRequired: false,
    discordGuildId: null,
    discordGuildName: null,
    submissionsOpen: true,
    twitch: '',
    twitter: '',
    mastodon: '',
    bluesky: '',
    discord: '',
    youtube: '',
    discordPrivate: false,
    defaultSetupTime: 'PT10M',
    selectionDone: false,
    scheduleDone: false,
    webhook: '',
    announceAcceptedSubmissions: true,
    ...overrides,
  };
}
