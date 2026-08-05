import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { faker } from '@faker-js/faker';
import { firstValueFrom, of } from 'rxjs';
import { UsernameExistsValidatorDirective } from './username-exists-validator.directive';
import { UserService } from '../../services/user.service';

describe('UsernameExistsValidatorDirective', () => {
  let directive: UsernameExistsValidatorDirective;
  let userServiceStub: { exists: ReturnType<typeof vi.fn>; user: any };

  beforeEach(() => {
    userServiceStub = { exists: vi.fn(), user: null };

    TestBed.configureTestingModule({
      providers: [
        UsernameExistsValidatorDirective,
        { provide: UserService, useValue: userServiceStub },
      ],
    });
    directive = TestBed.inject(UsernameExistsValidatorDirective);
  });

  it('returns null when username does not exist', async () => {
    userServiceStub.exists.mockReturnValue(of({ exists: false }));
    const name = faker.internet.username();

    const result = await firstValueFrom(directive.validate({ value: name } as any) as any);

    expect(result).toBeNull();
  });

  it('returns exists error when username is taken', async () => {
    userServiceStub.exists.mockReturnValue(of({ exists: true }));
    const name = faker.internet.username();

    const result = await firstValueFrom(directive.validate({ value: name } as any) as any);

    expect(result).toEqual({ exists: true });
  });

  it('returns null when username matches current user', async () => {
    const name = faker.internet.username();
    userServiceStub.user = { username: name };
    userServiceStub.exists.mockReturnValue(of({ exists: true }));

    const result = await firstValueFrom(directive.validate({ value: name } as any) as any);

    expect(result).toBeNull();
  });
});
