import { faker } from '@faker-js/faker';
import { BasicUserInfo, SelfUser, User } from '../../model/user';
import { UserProfile } from '../../model/user-profile';

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

export function makeUserProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  const profile = new UserProfile();
  profile.id = faker.number.int({ min: 1, max: 99999 });
  profile.username = faker.internet.username().toLowerCase();
  profile.displayName = faker.person.fullName();
  profile.enabled = true;
  profile.banned = false;
  profile.country = faker.location.countryCode();
  profile.pronouns = [faker.helpers.arrayElement(['he/him', 'she/her', 'they/them'])];
  profile.languagesSpoken = [faker.helpers.arrayElement(['en', 'fr', 'de', 'nl', 'ja'])];
  profile.connections = [];
  profile.savedGamesPublic = faker.datatype.boolean();
  return Object.assign(profile, overrides);
}
