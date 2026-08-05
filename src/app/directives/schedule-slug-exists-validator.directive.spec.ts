import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { faker } from '@faker-js/faker';
import { firstValueFrom, of } from 'rxjs';
import { ScheduleSlugExistsValidatorDirective } from './schedule-slug-exists-validator.directive';
import { ScheduleService } from '../../services/schedule.service';
import { MarathonService } from '../../services/marathon.service';

describe('ScheduleSlugExistsValidatorDirective', () => {
  let directive: ScheduleSlugExistsValidatorDirective;
  let scheduleServiceStub: { isSlugInUse: ReturnType<typeof vi.fn> };
  let marathonServiceStub: { marathon: { id: string } };

  beforeEach(() => {
    scheduleServiceStub = { isSlugInUse: vi.fn() };
    marathonServiceStub = { marathon: { id: faker.string.alphanumeric(8) } };

    TestBed.configureTestingModule({
      providers: [
        ScheduleSlugExistsValidatorDirective,
        { provide: ScheduleService, useValue: scheduleServiceStub },
        { provide: MarathonService, useValue: marathonServiceStub },
      ],
    });
    directive = TestBed.inject(ScheduleSlugExistsValidatorDirective);
  });

  it('returns null immediately when slug matches previous value', async () => {
    directive.appScheduleSlugExistsValidator = 'my-slug';

    const result = await directive.validate({ value: 'my-slug' } as any);

    expect(scheduleServiceStub.isSlugInUse).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('returns null when slug is not in use', async () => {
    scheduleServiceStub.isSlugInUse.mockReturnValue(of({ status: false }));
    const slug = faker.string.alphanumeric(6);

    const result = await firstValueFrom(directive.validate({ value: slug } as any) as any);

    expect(result).toBeNull();
  });

  it('returns exists error when slug is in use', async () => {
    scheduleServiceStub.isSlugInUse.mockReturnValue(of({ status: true }));
    const slug = faker.string.alphanumeric(6);

    const result = await firstValueFrom(directive.validate({ value: slug } as any) as any);

    expect(result).toEqual({ exists: true });
  });
});
