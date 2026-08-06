import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { WidgetSigninPickerComponent } from './widget-signin-picker.component';
import { TranslateTestingModule, routerTestProviders } from '../../../testing';
import { AuthService } from '../../../services/auth.service';

describe('WidgetSigninPickerComponent', () => {
  let fixture: ComponentFixture<WidgetSigninPickerComponent>;
  let component: WidgetSigninPickerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WidgetSigninPickerComponent, TranslateTestingModule],
      providers: [
        ...routerTestProviders,
        { provide: AuthService, useValue: { oauthUrl: () => '' } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(WidgetSigninPickerComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('dropdownItemClass returns dropdown-item for DROPDOWN type', () => {
    component.type = 'DROPDOWN';
    expect(component.dropdownItemClass).toBe('dropdown-item');
  });

  it('dropdownItemClass returns navbar-item for NAVBAR type', () => {
    component.type = 'NAVBAR';
    expect(component.dropdownItemClass).toBe('navbar-item');
  });

  it('navbar HostBinding returns true for NAVBAR type', () => {
    component.type = 'NAVBAR';
    expect(component.navbar).toBe(true);
  });

  it('storeCurrentPage saves pathname and returns true', () => {
    Object.defineProperty(window, 'location', { value: { pathname: '/marathon/bsm2025' }, configurable: true });

    const result = component.storeCurrentPage();

    expect(localStorage.getItem('prev_loc')).toBe('/marathon/bsm2025');
    expect(result).toBe(true);
  });
});
