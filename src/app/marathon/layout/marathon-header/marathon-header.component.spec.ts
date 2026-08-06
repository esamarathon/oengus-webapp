import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { faker } from '@faker-js/faker';
import { MarathonHeaderComponent } from './marathon-header.component';
import { TranslateTestingModule, makeMarathon } from '../../../../testing';
import { MarathonService } from '../../../../services/marathon.service';

describe('MarathonHeaderComponent', () => {
  let fixture: ComponentFixture<MarathonHeaderComponent>;
  let component: MarathonHeaderComponent;
  let marathonServiceStub: Record<string, any>;

  beforeEach(async () => {
    marathonServiceStub = {
      marathon: makeMarathon(),
    };

    await TestBed.configureTestingModule({
      imports: [MarathonHeaderComponent, TranslateTestingModule],
      providers: [
        { provide: MarathonService, useValue: marathonServiceStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(MarathonHeaderComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(MarathonHeaderComponent);
    component = fixture.componentInstance;
    component.marathon = makeMarathon();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('marathonName returns name from marathonService', () => {
    const name = faker.company.name();
    marathonServiceStub.marathon = makeMarathon({ name });

    expect(component.marathonName).toBe(name);
  });

  it('marathonName returns empty string when service marathon is null', () => {
    marathonServiceStub.marathon = null;

    expect(component.marathonName).toBe('');
  });

  it('buttonClass returns is-active true when not collapsed', () => {
    component.collapsed = false;

    expect(component.buttonClass).toEqual({ 'is-active': true });
  });

  it('buttonClass returns is-active false when collapsed', () => {
    component.collapsed = true;

    expect(component.buttonClass).toEqual({ 'is-active': false });
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
