import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SidebarComponent } from './sidebar.component';
import { TranslateTestingModule, makeMarathon } from '../../../../testing';

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let component: SidebarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent, TranslateTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(SidebarComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    component.marathon = makeMarathon();
  });
  it('isActiveClass returns is-active true when not collapsed', () => {
    component.collapsed = false;

    expect(component.isActiveClass).toEqual({ 'is-active': true });
  });

  it('isActiveClass returns is-active false when collapsed', () => {
    component.collapsed = true;

    expect(component.isActiveClass).toEqual({ 'is-active': false });
  });

  it('isAdmin defaults to false', () => {
    expect(component.isAdmin).toBe(false);
  });

  it('collapsed defaults to false', () => {
    expect(component.collapsed).toBe(false);
  });

  it('toggleSidebar emits when triggered', () => {
    let emitted: boolean | undefined;
    component.toggleSidebar.subscribe((v: boolean) => (emitted = v));

    component.toggleSidebar.emit(true);

    expect(emitted).toBe(true);
  });
});
