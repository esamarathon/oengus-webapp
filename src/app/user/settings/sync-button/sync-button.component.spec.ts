import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SyncButtonComponent } from './sync-button.component';
import { TranslateTestingModule } from '../../../../testing';

describe('SyncButtonComponent', () => {
  let fixture: ComponentFixture<SyncButtonComponent>;
  let component: SyncButtonComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SyncButtonComponent, TranslateTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SyncButtonComponent);
    component = fixture.componentInstance;
  });

  it('creates with defaults', () => {
    expect(component).toBeTruthy();
    expect(component.title).toBe('');
    expect(component.username).toBe('');
    expect(component.synced).toBe(false);
  });

  it('emits sync event', () => {
    const spy = vi.fn();
    component.sync.subscribe(spy);

    component.sync.emit();

    expect(spy).toHaveBeenCalled();
  });

  it('emits unsync event', () => {
    const spy = vi.fn();
    component.unsync.subscribe(spy);

    component.unsync.emit();

    expect(spy).toHaveBeenCalled();
  });
});
