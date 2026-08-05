import { describe, it, expect } from 'vitest';
import { faker } from '@faker-js/faker';
import { MaxNumberValidatorDirective } from './max-number-validator.directive';

describe('MaxNumberValidatorDirective', () => {
  let directive: MaxNumberValidatorDirective;

  beforeEach(() => {
    directive = new MaxNumberValidatorDirective();
    directive.maxNumber = 10;
  });

  it('returns null when value is below max', () => {
    const value = faker.number.int({ min: 0, max: 9 });
    expect(directive.validate({ value } as any)).toBeNull();
  });

  it('returns null when value equals max', () => {
    expect(directive.validate({ value: 10 } as any)).toBeNull();
  });

  it('returns error when value exceeds max', () => {
    const value = faker.number.int({ min: 11, max: 100 });
    expect(directive.validate({ value } as any)).toEqual({ maxNumber: true });
  });
});
