import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ScheduleService } from '../../services/schedule.service';
import { Schedule, V2Schedule } from '../../model/schedule';
import { RunType, ScheduleLine, V2ScheduleLine } from '../../model/schedule-line';

/**
 * @deprecated api has changed!
 */
@Injectable()
export class ScheduleV1ModelResolver  {

  constructor(private scheduleService: ScheduleService) {
  }

  async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<Schedule> {
    const withCustomData = route.data['withCustomData'] || false;
    const adminRoute = route.data['isAdminRoute'] || false;

    return firstValueFrom(
      this.scheduleService.getAllForMarathon(route.parent.paramMap.get('id'), withCustomData, adminRoute)
    ).catch(() => {
      return new Schedule();
    });
  }
}
