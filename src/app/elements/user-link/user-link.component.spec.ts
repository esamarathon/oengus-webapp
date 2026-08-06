import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { faker } from '@faker-js/faker';
import { UserLinkComponent } from './user-link.component';
import { makeBasicUserInfo } from '../../../testing';

describe('UserLinkComponent', () => {
  let fixture: ComponentFixture<UserLinkComponent>;
  let component: UserLinkComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserLinkComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(UserLinkComponent);
    component = fixture.componentInstance;
  });
  describe('userId', () => {
    it('returns user.username when user is set', () => {
      const user = makeBasicUserInfo();
      component.user = user;

      expect(component.userId).toBe(user.username);
    });

    it('falls back to username input', () => {
      const name = faker.internet.username();
      component.username = name;

      expect(component.userId).toBe(name);
    });
  });

  describe('displayName', () => {
    it('returns user.displayName when set', () => {
      const user = makeBasicUserInfo();
      component.user = user;

      expect(component.displayName).toBe(user.displayName);
    });

    it('falls back to username input', () => {
      const name = faker.internet.username();
      component.username = name;

      expect(component.displayName).toBe(name);
    });
  });

  describe('avatarUrl', () => {
    it('builds avatar URL from userId', () => {
      const user = makeBasicUserInfo();
      component.user = user;

      expect(component.avatarUrl).toContain(`/v2/users/${user.username}/avatar`);
    });
  });
});
