import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { faker } from '@faker-js/faker';
import { ActivatedRoute } from '@angular/router';
import { IncentiveComponent } from './incentive.component';
import { TranslateTestingModule, makeMarathon } from '../../../testing';
import { MarathonService } from '../../../services/marathon.service';

describe('IncentiveComponent', () => {
  let fixture: ComponentFixture<IncentiveComponent>;
  let component: IncentiveComponent;
  const mockIncentives = [{ id: faker.number.int(), name: faker.lorem.word() }];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncentiveComponent, TranslateTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { data: { incentives: mockIncentives } } } },
        { provide: MarathonService, useValue: { marathon: makeMarathon() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(IncentiveComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(IncentiveComponent);
    component = fixture.componentInstance;
  });
  it('incentives are loaded from route data', () => {
    expect(component.incentives).toBe(mockIncentives);
  });

  it('title is Incentives', () => {
    expect(component.title).toBe('Incentives');
  });
});
