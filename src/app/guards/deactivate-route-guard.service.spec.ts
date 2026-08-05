import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DeactivateRouteGuard } from './deactivate-route-guard.service';
import { faker } from '@faker-js/faker';

describe('DeactivateRouteGuard', () => {
  let guard: DeactivateRouteGuard;

  beforeEach(() => {
    guard = new DeactivateRouteGuard();
    DeactivateRouteGuard.deactivatedRoutes = [];
  });

  afterEach(() => {
    DeactivateRouteGuard.deactivatedRoutes = [];
  });

  // environment.prod.v2Domain is false, so guard always allows
  it('allows navigation when v2Domain is falsy (current config)', () => {
    const url = '/' + faker.string.alphanumeric(6);
    DeactivateRouteGuard.deactivatedRoutes = [url];

    const result = guard.canActivate({} as any, { url } as any);

    expect(result).toBe(true);
  });

  it('maintains a static deactivatedRoutes list', () => {
    const url = '/' + faker.string.alphanumeric(6);
    DeactivateRouteGuard.deactivatedRoutes.push(url);

    expect(DeactivateRouteGuard.deactivatedRoutes).toContain(url);
  });
});
