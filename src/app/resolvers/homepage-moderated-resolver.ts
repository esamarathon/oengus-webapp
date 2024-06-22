import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MarathonService } from '../../services/marathon.service';
import { Marathon } from '../../model/marathon';
import { UserService } from '../../services/user.service';

@Injectable()
export class HomepageModeratedResolver  {

  constructor(private marathonService: MarathonService, private userService: UserService) {
  }

  async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<Marathon[]> {
    if (!this.userService.token) {
      return [];
    }

    try {
      const data = await firstValueFrom(this.marathonService.findHomepageModerated());

      return data.marathons;
    } catch {
      return [];
    }
  }
}
