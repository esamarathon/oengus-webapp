import { describe, it, expect } from 'vitest';
import { CanActivateMarathonIncentivesGuard } from './can-activate-marathon-incentives-guard.service';

describe('CanActivateMarathonIncentivesGuard', () => {
  it('always returns false (incentives disabled)', () => {
    const guard = new CanActivateMarathonIncentivesGuard();

    expect(guard.canActivate()).toBe(false);
  });
});
