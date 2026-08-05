import { describe, it, expect } from 'vitest';
import { faker } from '@faker-js/faker';
import { TotalValidatorDirective } from './total-validator.directive';

describe('TotalValidatorDirective', () => {
  let directive: TotalValidatorDirective;

  beforeEach(() => {
    directive = new TotalValidatorDirective();
    directive.total = 100;
  });

  it('returns null when sum of amount fields is within total', () => {
    const value = { amount1: 30, amount2: 40, other: 'ignored' };
    expect(directive.validate({ value } as any)).toBeNull();
  });

  it('returns null when sum equals total', () => {
    const value = { amount1: 60, amount2: 40 };
    expect(directive.validate({ value } as any)).toBeNull();
  });

  it('returns error when sum exceeds total', () => {
    const value = { amount1: 60, amount2: 50 };
    expect(directive.validate({ value } as any)).toEqual({ total: true });
  });

  it('returns null when total is not set (falsy)', () => {
    directive.total = 0 as any;
    const value = { amount1: faker.number.int({ min: 100, max: 999 }) };
    expect(directive.validate({ value } as any)).toBeNull();
  });
});
