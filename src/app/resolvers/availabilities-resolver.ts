import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { SubmissionService } from '../../services/submission.service';

@Injectable()
export class AvailabilitiesResolver  {

  constructor(private submissionService: SubmissionService) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any {
    return this.submissionService.availabilities(route.parent.paramMap.get('id'));
  }
}
