import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import { Router } from '@angular/router';
import { Marathon } from '../model/marathon';
import { NwbAlertService } from '@wizishop/ng-wizi-bulma';
import { Observable, Subscription } from 'rxjs';
import { ValidationErrors } from '@angular/forms';
import { UserService } from './user.service';
import { HomepageMetadata } from '../model/homepage-metadata';
import { TranslateService } from '@ngx-translate/core';
import moment from 'moment-timezone';
import { User } from '../model/user';
import {BaseService} from './BaseService';

@Injectable({
  providedIn: 'root'
})
export class MarathonService extends BaseService {
  private _marathon: Marathon;

  get marathon(): Marathon {
    return this._marathon;
  }

  set marathon(value: Marathon) {
    this._marathon = value;
  }

  constructor(private http: HttpClient,
              private router: Router,
              toastr: NwbAlertService,
              private userService: UserService,
              private translateService: TranslateService) {
    super(toastr);
  }

  create(marathon: Marathon): Subscription {
    marathon.creator = this.userService.user;
    return this.http.put(this.url('marathon'), marathon, {observe: 'response'}).subscribe((response: any) => {
      this.router.navigate(['/marathon/' + response.headers.get('Location')]);

      this.translateService.get('alert.marathon.creation.success').subscribe((res: string) => {
        this.toast(res);
      });
    }, () => {
      this.translateService.get('alert.marathon.creation.error').subscribe((res: string) => {
        this.toast(res, 3000, 'warning');
      });
    });
  }

  update(marathon: Marathon, showToaster: boolean = true) {
    return this.http.patch(this.url(`marathon/${marathon.id}`), marathon).subscribe(() => {
      if (showToaster) {
        this.translateService.get('alert.marathon.update.success').subscribe((res: string) => {
          this.toast(res);
        });
      }

      this._marathon = {...marathon};
    }, () => {
      this.translateService.get('alert.marathon.update.error').subscribe((res: string) => {
        this.toast(res, 3000, 'warning');
      });
    });
  }

  exists(name: string): Observable<ValidationErrors> {
    return this.http.get<ValidationErrors>(this.url(`marathon/${name}/exists`));
  }

  find(name: string): Observable<Marathon> {
    return this.http.get<Marathon>(this.url(`marathon/${name}`));
  }

  delete(name: string) {
    this.http.delete(this.url(`marathon/${name}`)).subscribe(() => {
      this.translateService.get('alert.marathon.deletion.success').subscribe((res: string) => {
        this.toast(res);
      });
      this.router.navigate(['/']);
    }, () => {
      this.translateService.get('alert.marathon.deletion.error').subscribe((res: string) => {
        this.toast(res, 3000, 'warning');
      });
    });
  }

  findHomepageMetadata(): Observable<HomepageMetadata> {
    return this.http.get<HomepageMetadata>(this.url('marathon'));
  }

  findForMonth(start: Date, end: Date): Observable<Marathon[]> {
    const params = new HttpParams()
      .set('start', start.toISOString())
      .set('end', end.toISOString())
      .set('zoneId', moment.tz.guess());

    return this.http.get<Marathon[]>(this.url(`marathon/forDates`), { params });
  }

  isArchived(marathon: Marathon = this._marathon): boolean {
    return moment(marathon.endDate).isBefore(moment());
  }

  fetchDiscordInfo(marathon: Marathon): Observable<{ id: string, name: string }> {
    return this.http.get<any>(this.url(`marathon/${marathon.id}/discord/lookup-invite?invite_code=${marathon.discord}`));
  }

  isAdmin(user: User): boolean {
    if (!user) {
      return false;
    }
    return user.id === this.marathon.creator.id ||
      !!this.marathon.moderators.find(u => u.id === user.id) ||
      user.roles.includes('ROLE_ADMIN');
  }

  hasDstChange(): boolean {
    return moment(this.marathon.startDate).isDST() !== moment(this.marathon.endDate).isDST();
  }

  isWebhookOnline(marathonId: string, url: string): Observable<any> {
    const params = new HttpParams().set('url', url);
    return this.http.get(this.url(`marathon/${marathonId}/webhook`), {
      params: params
    });
  }
}
