import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CanActivateMarathonActiveGuard } from './can-activate-marathon-active-guard.service';
import { MarathonService } from '../../services/marathon.service';
import { makeMarathon } from '../../testing';
import { of } from 'rxjs';

describe('CanActivateMarathonActiveGuard', () => {
  let guard: CanActivateMarathonActiveGuard;
  let marathonServiceStub: {
    marathon: any;
    find: ReturnType<typeof vi.fn>;
    isArchived: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    marathonServiceStub = {
      marathon: null,
      find: vi.fn(),
      isArchived: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        CanActivateMarathonActiveGuard,
        { provide: MarathonService, useValue: marathonServiceStub },
      ],
    });
    guard = TestBed.inject(CanActivateMarathonActiveGuard);
  });

  it('returns true when marathon is loaded and not archived', () => {
    marathonServiceStub.marathon = makeMarathon();
    marathonServiceStub.isArchived.mockReturnValue(false);

    const result = guard.canActivate({} as any);

    expect(result).toBe(true);
  });

  it('returns false when marathon is loaded and archived', () => {
    marathonServiceStub.marathon = makeMarathon();
    marathonServiceStub.isArchived.mockReturnValue(true);

    const result = guard.canActivate({} as any);

    expect(result).toBe(false);
  });

  it('fetches marathon and checks archive status when not loaded', async () => {
    marathonServiceStub.marathon = null;
    const marathon = makeMarathon();
    marathonServiceStub.find.mockReturnValue(of(marathon));
    marathonServiceStub.isArchived.mockReturnValue(false);

    const route = { parent: { paramMap: { get: () => 'test-id' } } } as any;
    const result = await guard.canActivate(route);

    expect(marathonServiceStub.find).toHaveBeenCalledWith('test-id');
    expect(result).toBe(true);
  });
});
