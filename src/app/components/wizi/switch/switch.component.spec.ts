import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NwbSwitchComponent } from './switch.component';

describe('NwbSwitchComponent', () => {
  let fixture: ComponentFixture<NwbSwitchComponent>;
  let component: NwbSwitchComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NwbSwitchComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NwbSwitchComponent);
    component = fixture.componentInstance;
  });

  it('creates with defaults', () => {
    expect(component).toBeTruthy();
    expect(component.checked).toBe(true);
    expect(component.disabled).toBe(false);
  });

  describe('ControlValueAccessor', () => {
    it('writeValue sets checked state', () => {
      component.writeValue(false);
      expect(component.checked).toBe(false);

      component.writeValue(true);
      expect(component.checked).toBe(true);
    });

    it('ignores non-boolean values in writeValue', () => {
      component.writeValue(false);
      component.writeValue('not a boolean' as any);
      expect(component.checked).toBe(false);
    });

    it('registerOnChange stores the callback', () => {
      const fn = vi.fn();
      component.registerOnChange(fn);

      component.writeValue(false);

      expect(fn).toHaveBeenCalledWith(false);
    });

    it('setDisabledState sets disabled', () => {
      component.setDisabledState(true);
      expect(component.disabled).toBe(true);

      component.setDisabledState(false);
      expect(component.disabled).toBe(false);
    });
  });

  describe('getId()', () => {
    it('returns a stable id on repeated calls', () => {
      const id1 = component.getId();
      const id2 = component.getId();

      expect(id1).toBe(id2);
      expect(id1).toContain('search-');
    });
  });
});
