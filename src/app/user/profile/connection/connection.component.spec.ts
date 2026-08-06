import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ConnectionComponent } from './connection.component';
import { SocialAccount } from '../../../../model/social-account';

describe('ConnectionComponent', () => {
  let fixture: ComponentFixture<ConnectionComponent>;
  let component: ConnectionComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConnectionComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ConnectionComponent);
    component = fixture.componentInstance;
  });
  describe('profileLink', () => {
    it('returns mastodon URL for MASTODON platform', () => {
      const account = new SocialAccount();
      account.platform = 'MASTODON';
      account.username = 'duncte123@tech.lgbt';
      component.connection = account;

      expect(component.profileLink).toBe('https://tech.lgbt/@duncte123');
    });

    it('returns fallback URL when platform has no urlPrefix', () => {
      const account = new SocialAccount();
      account.platform = 'DISCORD';
      account.username = 'duncte123';
      component.connection = account;

      expect(component.profileLink).toBe('https://patreon.com/oengusio');
    });

    it('returns concatenated URL for standard platforms', () => {
      const account = new SocialAccount();
      account.platform = 'TWITCH';
      account.username = 'duncte123';
      component.connection = account;

      expect(component.profileLink).toBe('https://www.twitch.tv/duncte123');
    });

    it('returns speedrun.com URL for SPEEDRUNCOM platform', () => {
      const account = new SocialAccount();
      account.platform = 'SPEEDRUNCOM';
      account.username = 'duncte123';
      component.connection = account;

      expect(component.profileLink).toBe('https://speedrun.com/user/duncte123');
    });
  });

  describe('platformMap', () => {
    it('has an icon for every ConnectionPlatform', () => {
      const expectedPlatforms = [
        'SPEEDRUNCOM', 'MASTODON', 'TWITTER', 'TWITCH', 'FACEBOOK',
        'INSTAGRAM', 'SNAPCHAT', 'DISCORD', 'EMAIL', 'PHONE',
        'BLUESKY', 'NICO', 'YOUTUBE', 'SPEEDRUNSME',
      ];

      for (const platform of expectedPlatforms) {
        expect(component.platformMap[platform as keyof typeof component.platformMap]).toBeDefined();
      }
    });
  });
});
