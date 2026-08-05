import { describe, it, expect } from 'vitest';
import { faker } from '@faker-js/faker';
import { parseMastodonUrl, getRunnerUsername, getRunnerDisplayName } from './helpers';
import { LineRunner } from '../model/schedule-line';
import { makeBasicUserInfo } from '../testing';

describe('helpers', () => {
  describe('parseMastodonUrl', () => {
    it('converts @user@instance to a profile URL', () => {
      const username = faker.internet.username().toLowerCase();
      const instance = faker.internet.domainName();

      expect(parseMastodonUrl(`@${username}@${instance}`))
        .toBe(`https://${instance}/@${username}`);
    });

    it('works without leading @', () => {
      const username = faker.internet.username().toLowerCase();
      const instance = faker.internet.domainName();

      expect(parseMastodonUrl(`${username}@${instance}`))
        .toBe(`https://${instance}/@${username}`);
    });

    it('defaults to mastodon.social when no instance given', () => {
      const username = faker.internet.username().toLowerCase();

      expect(parseMastodonUrl(`@${username}`))
        .toBe(`https://mastodon.social/@${username}`);
    });

    it('strips @ prefix for bsky.brid.gy', () => {
      const username = faker.internet.username().toLowerCase();

      expect(parseMastodonUrl(`@${username}@bsky.brid.gy`))
        .toBe(`https://bsky.brid.gy/${username}`);
    });

    it('returns empty string for empty input', () => {
      expect(parseMastodonUrl('')).toBe('');
    });
  });

  describe('getRunnerUsername', () => {
    it('returns profile username when profile exists', () => {
      const profile = makeBasicUserInfo();
      const runner: LineRunner = { profile };

      expect(getRunnerUsername(runner)).toBe(profile.username);
    });

    it('returns runnerName when no profile', () => {
      const name = faker.person.firstName();
      const runner: LineRunner = { runnerName: name };

      expect(getRunnerUsername(runner)).toBe(name);
    });

    it('returns MissingNo when neither profile nor runnerName', () => {
      const runner: LineRunner = {};

      expect(getRunnerUsername(runner)).toBe('MissingNo');
    });
  });

  describe('getRunnerDisplayName', () => {
    it('returns "displayName (username)" when profile exists', () => {
      const profile = makeBasicUserInfo();
      const runner: LineRunner = { profile };

      expect(getRunnerDisplayName(runner)).toBe(`${profile.displayName} (${profile.username})`);
    });

    it('returns runnerName when no profile', () => {
      const name = faker.person.firstName();
      const runner: LineRunner = { runnerName: name };

      expect(getRunnerDisplayName(runner)).toBe(name);
    });

    it('returns MissingNo when neither profile nor runnerName', () => {
      const runner: LineRunner = {};

      expect(getRunnerDisplayName(runner)).toBe('MissingNo');
    });
  });
});
