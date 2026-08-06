import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BoxComponent } from './box.component';
import { TranslateTestingModule } from '../../../../../testing';
import { SocialAccount } from '../../../../../model/social-account';

describe('BoxComponent', () => {
  let fixture: ComponentFixture<BoxComponent>;
  let component: BoxComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoxComponent, TranslateTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(BoxComponent);
    component = fixture.componentInstance;
  });
  describe('usernameFormatted', () => {
    it('returns raw username when no formatter exists', () => {
      const account = new SocialAccount();
      account.platform = 'TWITCH';
      account.username = 'duncte123';
      component.connection = account;

      expect(component.usernameFormatted).toBe('duncte123');
    });

    it('applies formatter for YOUTUBE (prepends @)', () => {
      const account = new SocialAccount();
      account.platform = 'YOUTUBE';
      account.username = 'duncte123';
      component.connection = account;

      expect(component.usernameFormatted).toBe('@duncte123');
    });
  });

  describe('connectionMeta', () => {
    it('returns meta with link for TWITCH', () => {
      const account = new SocialAccount();
      account.platform = 'TWITCH';
      account.username = 'duncte123';
      component.connection = account;

      const meta = component.connectionMeta;

      expect(meta.link).toBe('https://www.twitch.tv/duncte123');
      expect(meta.icon).toBeDefined();
    });

    it('returns default meta for unknown platform', () => {
      const account = new SocialAccount();
      account.platform = 'NONEXISTENT' as any;
      account.username = 'test';
      component.connection = account;

      const meta = component.connectionMeta;

      expect(meta.icon).toBeDefined();
    });
  });
});
