import { describe, it, expect } from 'vitest';
import { faker } from '@faker-js/faker';
import { passwordResetErrorToMessage } from './authHelpers';

describe('authHelpers', () => {
  describe('passwordResetErrorToMessage', () => {
    it('returns joined defaultMessage values from validation errors', () => {
      const msg1 = faker.lorem.sentence();
      const msg2 = faker.lorem.sentence();
      const e = {
        error: {
          errors: [
            { defaultMessage: msg1 },
            { defaultMessage: msg2 },
          ],
        },
      };

      expect(passwordResetErrorToMessage(e)).toBe(`${msg1}\n${msg2}`);
    });

    it('splits comma-separated defaultMessage into separate lines', () => {
      const part1 = faker.lorem.word();
      const part2 = faker.lorem.word();
      const e = {
        error: {
          errors: [{ defaultMessage: `${part1},${part2}` }],
        },
      };

      expect(passwordResetErrorToMessage(e)).toBe(`${part1}\n${part2}`);
    });

    it('returns i18n key from error status', () => {
      const status = faker.helpers.arrayElement(['expired', 'invalid', 'not_found']);
      const e = {
        error: { status },
      };

      expect(passwordResetErrorToMessage(e))
        .toBe(`auth.passwordReset.error.${status.toUpperCase()}`);
    });

    it('returns message from a plain Error', () => {
      const message = faker.lorem.sentence();
      const e = new Error(message);

      expect(passwordResetErrorToMessage(e)).toBe(message);
    });
  });
});
