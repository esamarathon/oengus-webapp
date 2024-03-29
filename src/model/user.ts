import { SocialAccount } from './social-account';

export const MAX_NAME_LENGTH = 32;

export class User {

  id: number;
  username: string;
  displayName: string;
  mail: string;
  // stored as comma seperated list in db
  pronouns: string;
  languagesSpoken: string;
  mfaEnabled: boolean;
  emailVerified: boolean;
  country: string;
  roles: string[];
  connections: SocialAccount[];
  enabled: boolean;
  discordId: string;
  twitterId: string;
  twitchId: string;
  patreonId: string;
}
