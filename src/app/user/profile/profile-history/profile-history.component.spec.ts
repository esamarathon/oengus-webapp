import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ProfileHistoryComponent } from './profile-history.component';
import { TranslateTestingModule, makeUserProfile } from '../../../../testing';
import { UserService } from '../../../../services/user.service';
import { UserProfile } from '../../../../model/user-profile';
import { LocalizeRouterService } from '@oengusio/ngx-translate-router';

describe('ProfileHistoryComponent', () => {
  let fixture: ComponentFixture<ProfileHistoryComponent>;
  let component: ProfileHistoryComponent;
  let userServiceStub: {
    getSubmissionHistory: ReturnType<typeof vi.fn>;
    getModerationHistory: ReturnType<typeof vi.fn>;
    getSavedGamesList: ReturnType<typeof vi.fn>;
  };
  let queryParamsSubject: BehaviorSubject<Record<string, string>>;
  let testUser: UserProfile;

  beforeEach(async () => {
    testUser = makeUserProfile({ savedGamesPublic: true });

    queryParamsSubject = new BehaviorSubject<Record<string, string>>({});

    userServiceStub = {
      getSubmissionHistory: vi.fn().mockReturnValue(of({ data: [{ marathonId: 'test' }] })),
      getModerationHistory: vi.fn().mockReturnValue(of({ data: [{ marathonId: 'mod1' }] })),
      getSavedGamesList: vi.fn().mockReturnValue(of({ data: [{ id: 1, name: 'Game' }] })),
    };

    await TestBed.configureTestingModule({
      imports: [ProfileHistoryComponent, TranslateTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParams: queryParamsSubject.asObservable() } },
        { provide: LocalizeRouterService, useValue: { translateRoute: (p: string) => p, routerEvents: new Subject(), currentLang: 'en' } },
        { provide: UserService, useValue: userServiceStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(ProfileHistoryComponent, {
        set: { template: '' },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ProfileHistoryComponent);
    component = fixture.componentInstance;
    component.user = testUser;
    fixture.detectChanges();
    await fixture.whenStable();
  });
  it('defaults to submission tab', () => {
    expect(component.activeTab).toBe('submission');
  });

  it('fetches submission history on init for default tab', () => {
    expect(userServiceStub.getSubmissionHistory).toHaveBeenCalledWith(testUser.id);
  });

  it('fetches moderation history when tab switches', () => {
    queryParamsSubject.next({ 'user-history': 'moderation' });
    expect(userServiceStub.getModerationHistory).toHaveBeenCalledWith(testUser.id);
  });

  it('fetches saved games when tab switches', () => {
    queryParamsSubject.next({ 'user-history': 'saved' });
    expect(userServiceStub.getSavedGamesList).toHaveBeenCalledWith(testUser.id);
  });

  it('does not re-fetch when tab data is already loaded', () => {
    expect(userServiceStub.getSubmissionHistory).toHaveBeenCalledTimes(1);

    queryParamsSubject.next({});
    expect(userServiceStub.getSubmissionHistory).toHaveBeenCalledTimes(1);
  });

  it('skips saved games fetch when savedGamesPublic is false', () => {
    testUser.savedGamesPublic = false;
    queryParamsSubject.next({ 'user-history': 'saved' });
    expect(userServiceStub.getSavedGamesList).not.toHaveBeenCalled();
  });

  it('isActiveClass returns is-active for current tab', () => {
    expect(component.isActiveClass('submission')).toEqual({ 'is-active': true });
    expect(component.isActiveClass('moderation')).toEqual({ 'is-active': false });
  });

  it('queryFor builds params preserving existing query', () => {
    queryParamsSubject.next({ other: 'value' });

    const result = component.queryFor('moderation');
    expect(result).toEqual({ other: 'value', 'user-history': 'moderation' });
  });

  it('resetTabs clears fetched state and re-fetches', () => {
    expect(userServiceStub.getSubmissionHistory).toHaveBeenCalledTimes(1);

    component.resetTabs();
    expect(userServiceStub.getSubmissionHistory).toHaveBeenCalledTimes(2);
  });
});
