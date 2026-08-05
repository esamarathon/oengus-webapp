import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CanActivateMarathonSettingsGuard } from './can-activate-marathon-settings-guard.service';
import { UserService } from '../../services/user.service';
import { MarathonService } from '../../services/marathon.service';
import { makeBasicUserInfo, makeMarathon, makeSelfUser } from '../../testing';

describe('CanActivateMarathonSettingsGuard', () => {
  let guard: CanActivateMarathonSettingsGuard;
  let userServiceStub: { user: any; getMe: ReturnType<typeof vi.fn> };
  let marathonServiceStub: { marathon: any; find: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    userServiceStub = { user: null, getMe: vi.fn() };
    marathonServiceStub = { marathon: null, find: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        CanActivateMarathonSettingsGuard,
        { provide: UserService, useValue: userServiceStub },
        { provide: MarathonService, useValue: marathonServiceStub },
      ],
    });
    guard = TestBed.inject(CanActivateMarathonSettingsGuard);
  });

  it('allows when user is the marathon creator', () => {
    const user = makeSelfUser({ id: 42, roles: ['ROLE_USER'] });
    userServiceStub.user = user;
    marathonServiceStub.marathon = makeMarathon({ creator: makeBasicUserInfo({ id: 42 }), moderators: [] });

    const result = guard.canActivate({} as any);

    expect(result).toBe(true);
  });

  it('allows when user is a moderator', () => {
    const user = makeSelfUser({ id: 99, roles: ['ROLE_USER'] });
    userServiceStub.user = user;
    marathonServiceStub.marathon = makeMarathon({ moderators: [makeBasicUserInfo({ id: 99 })] });

    const result = guard.canActivate({} as any);

    expect(result).toBe(true);
  });

  it('allows when user is an admin', () => {
    const user = makeSelfUser({ roles: ['ROLE_ADMIN'] });
    userServiceStub.user = user;
    marathonServiceStub.marathon = makeMarathon();

    const result = guard.canActivate({} as any);

    expect(result).toBe(true);
  });

  it('blocks when user is banned', () => {
    const user = makeSelfUser({ id: 42, roles: ['ROLE_BANNED'] });
    userServiceStub.user = user;
    marathonServiceStub.marathon = makeMarathon({ creator: makeBasicUserInfo({ id: 42 }) });

    const result = guard.canActivate({} as any);

    expect(result).toBe(false);
  });

  it('blocks when user is a regular non-moderator', () => {
    const user = makeSelfUser({ id: 1, roles: ['ROLE_USER'] });
    userServiceStub.user = user;
    marathonServiceStub.marathon = makeMarathon({ moderators: [] });

    const result = guard.canActivate({} as any);

    expect(result).toBe(false);
  });
});
