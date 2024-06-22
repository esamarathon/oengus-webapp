import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { ScheduleService } from '../../services/schedule.service';
import { V2Schedule } from '../../model/schedule';

@Injectable()
export class ScheduleBySlugResolver  {

  constructor(private scheduleService: ScheduleService) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<V2Schedule> {
    return this.scheduleService.getBySlug(
      route.parent.paramMap.get('id'),
      route.paramMap.get('slug')
    );
  }
}
