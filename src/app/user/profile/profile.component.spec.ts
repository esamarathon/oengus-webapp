import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { faker } from '@faker-js/faker';
import { BehaviorSubject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ProfileComponent } from './profile.component';
import { makeUserProfile } from '../../../testing';
import { UserService } from '../../../services/user.service';
import { UserProfile } from '../../../model/user-profile';

describe('ProfileComponent', () => {
  let fixture: ComponentFixture<ProfileComponent>;
  let component: ProfileComponent;
  let userServiceStub: {
    isLoggedIn: ReturnType<typeof vi.fn>;
    isAdmin: ReturnType<typeof vi.fn>;
    user: { id: number };
  };
  let routeDataSubject: BehaviorSubject<{ user: UserProfile }>;
  let testUser: UserProfile;

  beforeEach(async () => {
    testUser = makeUserProfile();

    routeDataSubject = new BehaviorSubject<{ user: UserProfile }>({ user: testUser });

    userServiceStub = {
      isLoggedIn: vi.fn().mockReturnValue(true),
      isAdmin: vi.fn().mockReturnValue(false),
      user: { id: testUser.id },
    };

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { data: routeDataSubject.asObservable() } },
        { provide: UserService, useValue: userServiceStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(ProfileComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('sets user from route data', () => {
    expect(component.user).toBe(testUser);
  });

  it('title returns username', () => {
    expect(component.title).toBe(testUser.username);
  });

  it('title returns empty string when user is null', () => {
    component.user = null;
    expect(component.title).toBe('');
  });

  it('isAdmin returns true when logged-in admin', () => {
    userServiceStub.isAdmin.mockReturnValue(true);
    expect(component.isAdmin).toBe(true);
  });

  it('isAdmin returns false when not logged in', () => {
    userServiceStub.isLoggedIn.mockReturnValue(false);
    expect(component.isAdmin).toBe(false);
  });

  it('isSelf returns true when user ids match', () => {
    expect(component.isSelf).toBe(true);
  });

  it('isSelf returns false when ids differ', () => {
    userServiceStub.user.id = faker.number.int({ min: 100000, max: 200000 });
    expect(component.isSelf).toBe(false);
  });

  it('isSelf returns false when not logged in', () => {
    userServiceStub.isLoggedIn.mockReturnValue(false);
    expect(component.isSelf).toBe(false);
  });
});
