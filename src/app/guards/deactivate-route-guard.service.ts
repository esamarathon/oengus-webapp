import {Injectable} from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class DeactivateRouteGuard  {
  public static deactivatedRoutes: string[] = [];

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot)
    : Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (!environment.v2Domain) {
      return true;
    }

    return !DeactivateRouteGuard.deactivatedRoutes.includes(state.url);
  }
}
