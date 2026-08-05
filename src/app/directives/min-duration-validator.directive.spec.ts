import { describe, it, expect } from 'vitest';
import { MinDurationValidatorDirective } from './min-duration-validator.directive';

describe('MinDurationValidatorDirective', () => {
  let directive: MinDurationValidatorDirective;

  beforeEach(() => {
    directive = new MinDurationValidatorDirective();
    directive.minDuration = 60;
  });

  it('returns error for empty value', () => {
    expect(directive.validate({ value: '' } as any)).toEqual({ minDuration: true });
    expect(directive.validate({ value: null } as any)).toEqual({ minDuration: true });
  });

  it('returns null when duration exceeds min seconds', () => {
    expect(directive.validate({ value: '2h00m00s' } as any)).toBeNull();
  });

  it('returns error when duration is at or below min seconds', () => {
    expect(directive.validate({ value: '0h01m00s' } as any)).toEqual({ minDuration: true });
  });
});
