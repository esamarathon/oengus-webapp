import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { SubmissionService } from '../../services/submission.service';
import { Answer } from '../../model/answer';
import { UserService } from '../../services/user.service';

@Injectable()
export class AnswersResolver  {

  constructor(private submissionService: SubmissionService, private userService: UserService) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):
    Observable<Answer[]> | Promise<Answer[]> | Answer[] {
    if (!this.userService.token) {
      return [];
    }

    return this.submissionService.answers(route.parent.paramMap.get('id')).toPromise().catch(() => {
      return [];
    });
  }
}
