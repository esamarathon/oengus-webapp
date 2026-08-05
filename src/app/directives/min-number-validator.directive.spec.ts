import { describe, it, expect } from 'vitest';
import { faker } from '@faker-js/faker';
import { MinNumberValidatorDirective } from './min-number-validator.directive';

describe('MinNumberValidatorDirective', () => {
  let directive: MinNumberValidatorDirective;

  beforeEach(() => {
    directive = new MinNumberValidatorDirective();
    directive.minNumber = 5;
  });

  it('returns null when value is above min', () => {
    const value = faker.number.int({ min: 6, max: 100 });
    expect(directive.validate({ value } as any)).toBeNull();
  });

  it('returns null when value equals min', () => {
    expect(directive.validate({ value: 5 } as any)).toBeNull();
  });

  it('returns error when value is below min', () => {
    const value = faker.number.int({ min: 0, max: 4 });
    expect(directive.validate({ value } as any)).toEqual({ minNumber: true });
  });
});
