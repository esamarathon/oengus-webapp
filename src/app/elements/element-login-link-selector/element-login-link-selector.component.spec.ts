import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ElementLoginLinkSelectorComponent } from './element-login-link-selector.component';

describe('ElementLoginLinkSelectorComponent', () => {
  let fixture: ComponentFixture<ElementLoginLinkSelectorComponent>;
  let component: ElementLoginLinkSelectorComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ElementLoginLinkSelectorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ElementLoginLinkSelectorComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('storeCurrentLocation stores pathname in localStorage', () => {
    Object.defineProperty(window, 'location', { value: { pathname: '/marathon/bsm2025' }, configurable: true });

    component.storeCurrentLocation();

    expect(localStorage.getItem('prev_loc')).toBe('/marathon/bsm2025');
  });

  it('storeCurrentLocation stores / for login-related paths', () => {
    Object.defineProperty(window, 'location', { value: { pathname: '/login' }, configurable: true });

    component.storeCurrentLocation();

    expect(localStorage.getItem('prev_loc')).toBe('/');
  });

  it('storeCurrentLocation stores / for register path', () => {
    Object.defineProperty(window, 'location', { value: { pathname: '/register' }, configurable: true });

    component.storeCurrentLocation();

    expect(localStorage.getItem('prev_loc')).toBe('/');
  });

  it('onLinkClicked returns false', () => {
    Object.defineProperty(window, 'location', { value: { pathname: '/' }, configurable: true });
    expect(component.onLinkClicked()).toBe(false);
  });
});
