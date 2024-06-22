import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import {environment} from '../../environments/environment';
import {PatronApiResponse} from '../../model/patron';

@Injectable()
export class PatronsResolver  {

  constructor(private http: HttpClient) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):
    Observable<PatronApiResponse> | Promise<PatronApiResponse> | PatronApiResponse {
    return this.http.get<PatronApiResponse>(`${environment.patronApi}/patrons`);
  }
}
