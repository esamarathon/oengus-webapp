import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { SubmissionService } from '../../services/submission.service';
import {SubmissionPage} from '../../model/submission-page';

@Injectable()
export class SubmissionsResolver  {

  constructor(private submissionService: SubmissionService) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):
    Observable<SubmissionPage> | Promise<SubmissionPage> | SubmissionPage {
    return this.submissionService.submissions(route.parent.paramMap.get('id'), 1).toPromise().catch(() => {
      const a = new SubmissionPage();

      a.empty = true;
      a.last = true;

      return a;
    });
  }
}
