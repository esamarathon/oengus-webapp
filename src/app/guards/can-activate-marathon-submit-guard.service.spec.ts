import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CanActivateMarathonSubmitGuard } from './can-activate-marathon-submit-guard.service';
import { UserService } from '../../services/user.service';
import { MarathonService } from '../../services/marathon.service';
import { makeMarathon, makeSelfUser } from '../../testing';

describe('CanActivateMarathonSubmitGuard', () => {
  let guard: CanActivateMarathonSubmitGuard;
  let userServiceStub: { user: any; token: string | null; isBanned: ReturnType<typeof vi.fn>; getMe: ReturnType<typeof vi.fn> };
  let marathonServiceStub: { marathon: any; find: ReturnType<typeof vi.fn> };
  let routerStub: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    userServiceStub = { user: null, token: 'some-token', isBanned: vi.fn().mockReturnValue(false), getMe: vi.fn() };
    marathonServiceStub = { marathon: null, find: vi.fn() };
    routerStub = { navigate: vi.fn().mockResolvedValue(true) };

    TestBed.configureTestingModule({
      providers: [
        CanActivateMarathonSubmitGuard,
        { provide: UserService, useValue: userServiceStub },
        { provide: MarathonService, useValue: marathonServiceStub },
        { provide: Router, useValue: routerStub },
      ],
    });
    guard = TestBed.inject(CanActivateMarathonSubmitGuard);
  });

  it('navigates to /403 when no token', () => {
    userServiceStub.token = null;

    guard.canActivate({} as any);

    expect(routerStub.navigate).toHaveBeenCalledWith(['/403'], { skipLocationChange: true });
  });

  it('allows when user exists, not banned, and submissions are open', () => {
    userServiceStub.user = makeSelfUser();
    marathonServiceStub.marathon = makeMarathon({ canEditSubmissions: true });

    const result = guard.canActivate({} as any);

    expect(result).toBe(true);
  });

  it('blocks when user is banned', () => {
    userServiceStub.user = makeSelfUser();
    userServiceStub.isBanned.mockReturnValue(true);
    marathonServiceStub.marathon = makeMarathon({ canEditSubmissions: true });

    const result = guard.canActivate({} as any);

    expect(result).toBe(false);
  });

  it('blocks when submissions are not editable', () => {
    userServiceStub.user = makeSelfUser();
    marathonServiceStub.marathon = makeMarathon({ canEditSubmissions: false });

    const result = guard.canActivate({} as any);

    expect(result).toBe(false);
  });
});
