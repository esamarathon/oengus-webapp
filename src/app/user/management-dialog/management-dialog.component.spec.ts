import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { ManagementDialogComponent } from './management-dialog.component';
import { TranslateTestingModule, makeUserProfile } from '../../../testing';
import { UserService } from '../../../services/user.service';
import { UserProfile } from '../../../model/user-profile';

describe('ManagementDialogComponent', () => {
  let fixture: ComponentFixture<ManagementDialogComponent>;
  let component: ManagementDialogComponent;
  let userServiceStub: {
    fetchRoles: ReturnType<typeof vi.fn>;
    updateRoles: ReturnType<typeof vi.fn>;
    ban: ReturnType<typeof vi.fn>;
    unban: ReturnType<typeof vi.fn>;
    setEnabled: ReturnType<typeof vi.fn>;
  };
  let testUser: UserProfile;

  beforeEach(async () => {
    testUser = makeUserProfile();

    userServiceStub = {
      fetchRoles: vi.fn().mockReturnValue(of(['ROLE_USER'])),
      updateRoles: vi.fn().mockReturnValue(of(undefined)),
      ban: vi.fn().mockReturnValue(of(undefined)),
      unban: vi.fn().mockReturnValue(of(undefined)),
      setEnabled: vi.fn().mockReturnValue(of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [ManagementDialogComponent, TranslateTestingModule],
      providers: [
        { provide: UserService, useValue: userServiceStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ManagementDialogComponent);
    component = fixture.componentInstance;
    component.user = testUser;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('fetches roles on init', () => {
    expect(userServiceStub.fetchRoles).toHaveBeenCalledWith(testUser.id);
  });

  it('isRole returns true when role is present', () => {
    expect(component.isRole('user')).toBe(true);
  });

  it('isRole returns false when role is absent', () => {
    expect(component.isRole('admin')).toBe(false);
  });

  it('toggleRole adds a role when not present', () => {
    component.toggleRole('admin');
    expect(component.isRole('admin')).toBe(true);
  });

  it('toggleRole removes a role when present', () => {
    component.toggleRole('user');
    expect(component.isRole('user')).toBe(false);
  });

  it('banUser calls service and sets user.banned', () => {
    component.banUser();
    expect(userServiceStub.ban).toHaveBeenCalledWith(testUser.id);
    expect(testUser.banned).toBe(true);
  });

  it('unbanUser calls service and clears user.banned', () => {
    testUser.banned = true;
    component.unbanUser();
    expect(userServiceStub.unban).toHaveBeenCalledWith(testUser.id);
    expect(testUser.banned).toBe(false);
  });

  it('setActivated calls service and updates user.enabled', () => {
    component.setActivated(false);
    expect(userServiceStub.setEnabled).toHaveBeenCalledWith(testUser.id, false);
    expect(testUser.enabled).toBe(false);
  });
});
