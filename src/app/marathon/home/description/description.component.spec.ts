import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DescriptionComponent } from './description.component';
import { TranslateTestingModule, makeMarathon } from '../../../../testing';

describe('DescriptionComponent', () => {
  let fixture: ComponentFixture<DescriptionComponent>;
  let component: DescriptionComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DescriptionComponent, TranslateTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(DescriptionComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(DescriptionComponent);
    component = fixture.componentInstance;
    component.marathon = makeMarathon();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('accepts marathon input', () => {
    const marathon = makeMarathon({ description: 'A test marathon' });
    component.marathon = marathon;

    expect(component.marathon.description).toBe('A test marathon');
  });
});
