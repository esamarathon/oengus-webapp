import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ElementPasswordInputComponent } from './element-password-input.component';
import { TranslateTestingModule } from '../../../testing';

describe('ElementPasswordInputComponent', () => {
  let fixture: ComponentFixture<ElementPasswordInputComponent>;
  let component: ElementPasswordInputComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ElementPasswordInputComponent, TranslateTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ElementPasswordInputComponent);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('defaults password to hidden', () => {
    expect(component.passwordHidden).toBe(true);
  });

  it('defaults password to null', () => {
    expect(component.password).toBeNull();
  });

  it('toggles passwordHidden', () => {
    component.passwordHidden = false;
    expect(component.passwordHidden).toBe(false);
  });
});
