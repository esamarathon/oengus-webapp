import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { ScheduleService } from '../../services/schedule.service';
import { ScheduleInfo } from '../../model/schedule';

@Injectable()
export class ScheduleByIdResolver  {

  constructor(private scheduleService: ScheduleService) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):
    Observable<ScheduleInfo> | Promise<ScheduleInfo> | ScheduleInfo {
    const scheduleId = parseInt(route.paramMap.get('scheduleId'), 10);

    return this.scheduleService.getInfoById(route.parent.paramMap.get('id'), scheduleId);
  }
}
