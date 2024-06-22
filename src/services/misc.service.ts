import {Injectable} from '@angular/core';
import {BaseService} from './BaseService';
import {Observable} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import {NwbAlertService} from '@wizishop/ng-wizi-bulma';
import {Language} from '../model/language';

@Injectable({
  providedIn: 'root'
})
export class MiscService extends BaseService {
  constructor(private http: HttpClient,
              toastr: NwbAlertService) {
    super(toastr);
  }

  searchPronouns(pronouns: string): Observable<string[]> {
    return this.http.get<string[]>(this.url(`/pronouns?search=${pronouns}`));
  }

  searchLanguage(search: string): Observable<Language[]> {
    return this.http.get<Language[]>(this.url(`/languages?search=${search}&locale=${localStorage.getItem('language')}`));
  }
}
