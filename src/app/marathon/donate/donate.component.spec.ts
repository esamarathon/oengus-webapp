import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { faker } from '@faker-js/faker';
import { of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { DonateComponent, Link } from './donate.component';
import { TranslateTestingModule, makeMarathon, makeUser } from '../../../testing';
import { MarathonService } from '../../../services/marathon.service';
import { UserService } from '../../../services/user.service';
import { DonationService } from '../../../services/donation.service';

describe('DonateComponent', () => {
  let fixture: ComponentFixture<DonateComponent>;
  let component: DonateComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonateComponent, TranslateTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { data: { incentives: [] } } } },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: MarathonService, useValue: { marathon: makeMarathon({ questions: [], donationCurrency: 'USD' }) } },
        { provide: UserService, useValue: { user: makeUser() } },
        { provide: DonationService, useValue: { donate: vi.fn().mockReturnValue(of({})), validate: vi.fn(), cancel: vi.fn() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(DonateComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(DonateComponent);
    component = fixture.componentInstance;
  });
  it('addLink adds a new Link', () => {
    component.links = [];

    component.addLink();

    expect(component.links).toHaveLength(1);
    expect(component.links[0].amount).toBe(0);
  });

  it('removeLink removes at index', () => {
    const link1 = new Link();
    link1.amount = 5;
    const link2 = new Link();
    link2.amount = 10;
    component.links = [link1, link2];

    component.removeLink(0);

    expect(component.links).toHaveLength(1);
    expect(component.links[0].amount).toBe(10);
  });

  it('getLeftAmount returns donation amount minus links total', () => {
    component.donation.amount = 50;
    const link1 = new Link();
    link1.amount = 15;
    const link2 = new Link();
    link2.amount = 10;
    component.links = [link1, link2];

    expect(component.getLeftAmount()).toBe(25);
  });

  it('getLeftAmount returns 0 when no donation amount', () => {
    component.donation.amount = 0;
    component.links = [];

    expect(component.getLeftAmount()).toBe(0);
  });

  it('isBid returns true for bid objects', () => {
    expect(component.isBid({ incentiveId: 1, amount: 5 })).toBe(true);
  });

  it('isBid returns false for non-bid objects', () => {
    expect(component.isBid({ scheduleLine: {} })).toBe(false);
  });

  it('isIncentive returns true for incentive objects', () => {
    expect(component.isIncentive({ scheduleLine: {} })).toBe(true);
  });
});
