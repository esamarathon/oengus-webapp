import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { faker } from '@faker-js/faker';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { IncentiveManagementComponent } from './incentive-management.component';
import { TranslateTestingModule, makeMarathon } from '../../../testing';
import { MarathonService } from '../../../services/marathon.service';
import { IncentiveService } from '../../../services/incentive.service';
import { Incentive } from '../../../model/incentive';
import { Bid } from '../../../model/bid';

describe('IncentiveManagementComponent', () => {
  let fixture: ComponentFixture<IncentiveManagementComponent>;
  let component: IncentiveManagementComponent;
  let incentiveServiceStub: Record<string, any>;

  beforeEach(async () => {
    incentiveServiceStub = {
      saveAll: vi.fn().mockReturnValue({ add: (cb: any) => cb() }),
      getAllForMarathon: vi.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [IncentiveManagementComponent, TranslateTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { data: { schedule: { lines: [] }, incentives: [] } } } },
        { provide: MarathonService, useValue: { marathon: makeMarathon() } },
        { provide: IncentiveService, useValue: incentiveServiceStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(IncentiveManagementComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(IncentiveManagementComponent);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('addIncentive pushes new incentive', () => {
    component.incentives = [];

    component.addIncentive();

    expect(component.incentives).toHaveLength(1);
  });

  it('addBid pushes approved bid to incentive', () => {
    const incentive = new Incentive();
    component.incentives = [incentive];

    component.addBid(0);

    expect(incentive.bids).toHaveLength(1);
    expect(incentive.bids[0].approved).toBe(true);
  });

  it('removeBid marks bid as toDelete', () => {
    const incentive = new Incentive();
    const bid = new Bid();
    bid.toDelete = false;
    incentive.bids = [bid];
    component.incentives = [incentive];

    component.removeBid(0, 0);

    expect(bid.toDelete).toBe(true);
  });

  it('countNotDeletedBids returns count of non-deleted bids', () => {
    const incentive = new Incentive();
    const bid1 = new Bid();
    bid1.toDelete = false;
    const bid2 = new Bid();
    bid2.toDelete = true;
    const bid3 = new Bid();
    bid3.toDelete = false;
    incentive.bids = [bid1, bid2, bid3];

    expect(component.countNotDeletedBids(incentive)).toBe(2);
  });

  it('byId returns true when items have same id', () => {
    expect(component.byId({ id: 5 } as any, { id: 5 } as any)).toBe(true);
  });

  it('byId returns false when items have different ids', () => {
    expect(component.byId({ id: 5 } as any, { id: 6 } as any)).toBe(false);
  });

  it('byId returns false when either item is null', () => {
    expect(component.byId(null as any, { id: 5 } as any)).toBe(false);
  });

  it('submit calls incentiveService.saveAll', () => {
    component.incentives = [];

    component.submit();

    expect(incentiveServiceStub.saveAll).toHaveBeenCalled();
  });
});
