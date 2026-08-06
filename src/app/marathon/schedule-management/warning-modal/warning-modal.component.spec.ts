import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { WarningModalComponent } from './warning-modal.component';
import { TranslateTestingModule } from '../../../../testing';

describe('WarningModalComponent', () => {
  let fixture: ComponentFixture<WarningModalComponent>;
  let component: WarningModalComponent;

  beforeEach(async () => {
    vi.useFakeTimers();

    await TestBed.configureTestingModule({
      imports: [WarningModalComponent, TranslateTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(WarningModalComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.useRealTimers();
  });
  it('sets buttonLoading to true on init', () => {
    component.ngOnInit();
    expect(component.buttonLoading).toBe(true);
  });

  it('sets buttonLoading to false after 5 seconds', () => {
    component.ngOnInit();

    vi.advanceTimersByTime(5000);

    expect(component.buttonLoading).toBe(false);
  });

  it('emits publishConfirm output', () => {
    const spy = vi.fn();
    component.publishConfirm.subscribe(spy);

    component.publishConfirm.emit(true);

    expect(spy).toHaveBeenCalledWith(true);
  });
});
