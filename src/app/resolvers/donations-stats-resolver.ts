import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { DonationService } from '../../services/donation.service';
import { DonationStats } from '../../model/donation-stats';

@Injectable()
export class DonationsStatsResolver  {

  constructor(private donationService: DonationService) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):
    Observable<DonationStats> | Promise<DonationStats> | DonationStats {
    return this.donationService.findStats(route.parent.paramMap.get('id'));
  }
}
