import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { faker } from '@faker-js/faker';
import { firstValueFrom, of } from 'rxjs';
import { MarathonExistsValidatorDirective } from './marathon-exists-validator.directive';
import { MarathonService } from '../../services/marathon.service';

describe('MarathonExistsValidatorDirective', () => {
  let directive: MarathonExistsValidatorDirective;
  let marathonServiceStub: { exists: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    marathonServiceStub = { exists: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        MarathonExistsValidatorDirective,
        { provide: MarathonService, useValue: marathonServiceStub },
      ],
    });
    directive = TestBed.inject(MarathonExistsValidatorDirective);
  });

  it('returns null when marathon does not exist', async () => {
    marathonServiceStub.exists.mockReturnValue(of({ exists: false }));
    const name = faker.string.alphanumeric(8);

    const result = await firstValueFrom(directive.validate({ value: name } as any) as any);

    expect(result).toBeNull();
  });

  it('returns exists error when marathon exists and no previousMarathonName', async () => {
    marathonServiceStub.exists.mockReturnValue(of({ exists: true }));
    directive.previousMarathonName = '' as any;
    const name = faker.string.alphanumeric(8);

    const result = await firstValueFrom(directive.validate({ value: name } as any) as any);

    expect(result).toEqual({ exists: true });
  });

  it('returns raw errors when previousMarathonName is set', async () => {
    const errors = { exists: true };
    marathonServiceStub.exists.mockReturnValue(of(errors));
    directive.previousMarathonName = 'old-name';

    const result = await firstValueFrom(directive.validate({ value: 'new-name' } as any) as any);

    expect(result).toEqual(errors);
  });
});
