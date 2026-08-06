import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NewMarathonComponent } from './new-marathon.component';
import { TranslateTestingModule, makeMarathon } from '../../../testing';
import { MarathonService } from '../../../services/marathon.service';
import { TemporalServiceService } from '../../../services/termporal/temporal-service.service';

describe('NewMarathonComponent', () => {
  let fixture: ComponentFixture<NewMarathonComponent>;
  let component: NewMarathonComponent;
  let marathonServiceStub: Record<string, any>;

  beforeEach(async () => {
    marathonServiceStub = {
      create: vi.fn().mockReturnValue({ add: (cb: any) => cb() }),
    };

    const now = Temporal.ZonedDateTime.from({ timeZone: 'UTC', year: 2025, month: 6, day: 15, hour: 10, minute: 0, second: 0 });

    await TestBed.configureTestingModule({
      imports: [NewMarathonComponent, TranslateTestingModule],
      providers: [
        { provide: MarathonService, useValue: marathonServiceStub },
        { provide: TemporalServiceService, useValue: { now } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(NewMarathonComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(NewMarathonComponent);
    component = fixture.componentInstance;
    component.ngOnInit();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit creates a new Marathon', () => {
    expect(component.marathon).toBeDefined();
  });

  it('loading defaults to false', () => {
    expect(component.loading).toBe(false);
  });

  it('submit calls marathonService.create', () => {
    component.submit();

    expect(marathonServiceStub.create).toHaveBeenCalledWith(component.marathon);
  });

  it('submit sets loading true then false after callback', () => {
    component.submit();

    expect(component.loading).toBe(false);
  });
});
