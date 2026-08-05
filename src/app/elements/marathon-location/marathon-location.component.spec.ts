import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MarathonLocationComponent } from './marathon-location.component';
import { TranslateTestingModule, makeMarathon } from '../../../testing';

describe('MarathonLocationComponent', () => {
  let fixture: ComponentFixture<MarathonLocationComponent>;
  let component: MarathonLocationComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarathonLocationComponent, TranslateTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(MarathonLocationComponent);
    component = fixture.componentInstance;
    component.marathon = makeMarathon();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('hasCountry returns true when onsite and country is set', () => {
    component.marathon = makeMarathon({ onsite: true, country: 'NL' });
    expect(component.hasCountry).toBe(true);
  });

  it('hasCountry returns false when not onsite', () => {
    component.marathon = makeMarathon({ onsite: false, country: 'NL' });
    expect(component.hasCountry).toBe(false);
  });

  it('hasCountry returns false when country is empty', () => {
    component.marathon = makeMarathon({ onsite: true, country: '' });
    expect(component.hasCountry).toBe(false);
  });
});
