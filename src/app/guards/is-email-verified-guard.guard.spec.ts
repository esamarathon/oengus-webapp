import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { IsEmailVerifiedGuardGuard } from './is-email-verified-guard.guard';
import { UserService } from '../../services/user.service';
import { of } from 'rxjs';
import { makeSelfUser } from '../../testing';

describe('IsEmailVerifiedGuardGuard', () => {
  let guard: IsEmailVerifiedGuardGuard;
  let userServiceStub: { user: any; getMe: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    userServiceStub = { user: null, getMe: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        IsEmailVerifiedGuardGuard,
        { provide: UserService, useValue: userServiceStub },
      ],
    });
    guard = TestBed.inject(IsEmailVerifiedGuardGuard);
  });

  it('returns true when user is already loaded and email is verified', async () => {
    userServiceStub.user = makeSelfUser({ emailVerified: true });

    const result = await guard.canActivate();

    expect(result).toBe(true);
  });

  it('returns false when user is already loaded and email is not verified', async () => {
    userServiceStub.user = makeSelfUser({ emailVerified: false });

    const result = await guard.canActivate();

    expect(result).toBe(false);
  });

  it('fetches user and returns emailVerified when user is not loaded', async () => {
    const user = makeSelfUser({ emailVerified: true });
    userServiceStub.getMe.mockReturnValue(of(user));

    const result = await guard.canActivate();

    expect(userServiceStub.getMe).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('fetches user and returns false when email is not verified', async () => {
    const user = makeSelfUser({ emailVerified: false });
    userServiceStub.getMe.mockReturnValue(of(user));

    const result = await guard.canActivate();

    expect(result).toBe(false);
  });
});
