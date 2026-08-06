import { faker } from '@faker-js/faker';
import { Marathon, MarathonRaw, MarathonSettingsRawApi } from '../../model/marathon';
import { makeBasicUserInfo } from './user';

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
