import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SecurityPopupComponent } from './security-popup.component';

describe('SecurityPopupComponent', () => {
  let fixture: ComponentFixture<SecurityPopupComponent>;
  let component: SecurityPopupComponent;

  beforeEach(async () => {
    Object.defineProperty(document, 'cookie', { value: '', writable: true, configurable: true });

    await TestBed.configureTestingModule({
      imports: [SecurityPopupComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SecurityPopupComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    Object.defineProperty(document, 'cookie', { value: '', writable: true, configurable: true });
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('sets open to true when cookie is not present', () => {
    document.cookie = '';
    component.ngOnInit();
    expect(component.open).toBe(true);
  });

  it('sets open to false when popup_closed cookie exists', () => {
    document.cookie = 'popup_closed=true';
    component.ngOnInit();
    expect(component.open).toBe(false);
  });

  it('closePopup sets open to false', () => {
    component.open = true;
    component.closePopup();
    expect(component.open).toBe(false);
  });
});
