import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LoadingBarService } from './loading-bar.service';

describe('LoadingBarService', () => {
  let service: LoadingBarService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [LoadingBarService] });
    service = TestBed.inject(LoadingBarService);
  });

  it('should emit true via stateObserver when setLoading(true)', () => {
    let emitted: boolean | undefined;
    service.stateObserver.subscribe((val) => { emitted = val; });

    service.setLoading(true);

    expect(emitted).toBe(true);
  });

  it('should emit false via stateObserver when setLoading(false)', () => {
    let emitted: boolean | undefined;
    service.stateObserver.subscribe((val) => { emitted = val; });

    service.setLoading(false);

    expect(emitted).toBe(false);
  });

  it('should emit multiple state changes in order', () => {
    const values: boolean[] = [];
    service.stateObserver.subscribe((val) => { values.push(val); });

    service.setLoading(true);
    service.setLoading(false);
    service.setLoading(true);

    expect(values).toEqual([true, false, true]);
  });
});
