import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { UserProfileComponent } from './user-profile.component';
import { TranslateTestingModule, routerTestProviders, makeUserProfile } from '../../../../testing';
import { UserProfile } from '../../../../model/user-profile';

describe('UserProfileComponent', () => {
  let fixture: ComponentFixture<UserProfileComponent>;
  let component: UserProfileComponent;
  let testUser: UserProfile;

  beforeEach(async () => {
    testUser = makeUserProfile();

    await TestBed.configureTestingModule({
      imports: [UserProfileComponent, TranslateTestingModule],
      providers: [...routerTestProviders],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(UserProfileComponent);
    component = fixture.componentInstance;
    component.user = testUser;
  });
  it('avatarUrl uses username from environment api', () => {
    expect(component.avatarUrl).toContain(`/v2/users/${testUser.username}/avatar`);
  });

  it('fakeUserModel returns user cast as User', () => {
    expect(component.fakeUserModel).toBe(testUser as any);
  });
});
