import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { UserService } from '../../services/user.service';
import { UserProfile } from '../../model/user-profile';

@Injectable()
export class UserProfileResolver  {

  constructor(private userService: UserService) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<UserProfile> | Promise<UserProfile> | UserProfile {
    return this.userService.getProfile(route.paramMap.get('name').toLowerCase());
  }
}
