import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Submission } from '../../model/submission';
import { Observable } from 'rxjs';
import { SubmissionService } from '../../services/submission.service';

@Injectable()
export class SubmissionResolver  {

  constructor(private submissionService: SubmissionService) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Submission> | Promise<Submission> | Submission {
    return this.submissionService.mine(route.parent.paramMap.get('id'));
  }
}
