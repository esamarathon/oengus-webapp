import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ElementTableExpandButtonComponent } from './element-table-expand-button.component';
import { faCaretDown, faCaretRight } from '@fortawesome/free-solid-svg-icons';

describe('ElementTableExpandButtonComponent', () => {
  let fixture: ComponentFixture<ElementTableExpandButtonComponent>;
  let component: ElementTableExpandButtonComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ElementTableExpandButtonComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ElementTableExpandButtonComponent);
    component = fixture.componentInstance;
  });

  it('defaults expanded to false', () => {
    expect(component.expanded).toBe(false);
  });

  it('icon returns faCaretRight when collapsed', () => {
    component.expanded = false;
    expect(component.icon).toBe(faCaretRight);
  });

  it('icon returns faCaretDown when expanded', () => {
    component.expanded = true;
    expect(component.icon).toBe(faCaretDown);
  });
});
