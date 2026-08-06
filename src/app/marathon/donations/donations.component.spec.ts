import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DonationsComponent } from './donations.component';
import { TranslateTestingModule, makeMarathon } from '../../../testing';
import { MarathonService } from '../../../services/marathon.service';
import { DonationService } from '../../../services/donation.service';
import { UserService } from '../../../services/user.service';

describe('DonationsComponent', () => {
  let fixture: ComponentFixture<DonationsComponent>;
  let component: DonationsComponent;
  let donationServiceStub: { exportAllForMarathon: ReturnType<typeof vi.fn> };
  const marathon = makeMarathon({ id: 'bsm2025' });

  beforeEach(async () => {
    donationServiceStub = { exportAllForMarathon: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [DonationsComponent, TranslateTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { data: { donations: { content: [], totalElements: 0 }, stats: { total: 1234.56 } } } } },
        { provide: MarathonService, useValue: { marathon } },
        { provide: DonationService, useValue: donationServiceStub },
        { provide: UserService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DonationsComponent);
    component = fixture.componentInstance;
  });
  it('loads donations and stats from route data', () => {
    expect(component.donations).toEqual({ content: [], totalElements: 0 });
    expect(component.stats).toEqual({ total: 1234.56 });
  });

  it('sets marathon donationsTotal from stats', () => {
    expect(marathon.donationsTotal).toBe(1234.56);
  });

  it('exportToCsv calls donationService', () => {
    component.exportToCsv();
    expect(donationServiceStub.exportAllForMarathon).toHaveBeenCalledWith('bsm2025');
  });
});
