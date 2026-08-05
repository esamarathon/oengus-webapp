import { describe, it, expect } from 'vitest';
import { CanActivateMarathonDonationsGuard } from './can-activate-marathon-donations-guard.service';

describe('CanActivateMarathonDonationsGuard', () => {
  it('always returns false (donations disabled)', () => {
    const guard = new CanActivateMarathonDonationsGuard();

    expect(guard.canActivate()).toBe(false);
  });
});
