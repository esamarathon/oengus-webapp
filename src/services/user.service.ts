import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Router } from '@angular/router';
import { User, UserSupporterStatus } from '../model/user';
import { NwbAlertService } from '@wizishop/ng-wizi-bulma';
import { firstValueFrom, Observable, Subscription } from 'rxjs';
import { ValidationErrors } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { UserProfile } from '../model/user-profile';
import { BaseService } from './BaseService';
import { PatreonStatusDto, RelationShip } from '../model/annoying-patreon-shit';
import { HistoryMarathon, UserProfileHistory } from '../model/user-profile-history';
import { BooleanStatusDto, DataListDto } from '../model/dto/base-dtos';
import { map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root',
})
export class UserService extends BaseService {

  private _user: User;

  constructor(private http: HttpClient,
              private router: Router,
              toastr: NwbAlertService,
              private translateService: TranslateService) {
    super(toastr, 'users');
  }

  async sync(service: string, code?: string): Promise<any | RelationShip> {
    if (service === 'patreon') {
      const response = await this.http.get<RelationShip>(`${environment.patronApi}/sync?code=${code}`).toPromise() as any;

      const patreon = {
        ...response,
        id: response.data.id,
      };

      // Check if account is already synced
      await firstValueFrom(this.http.post(this.url('sync'), {
        service: 'patreon',
        code: patreon.id,
      }));

      return patreon;
    }

    return firstValueFrom(this.http.post(this.url('sync'), {
      service: service,
      code: code,
    }));
  }

  async updatePatreonStatus(userId: number, data: PatreonStatusDto): Promise<void> {
    return firstValueFrom(this.http.put<void>(this.url(`/${userId}/patreon-status`), data));
  }

  fetchRoles(userId: number): Observable<string[]> {
    return this.http.get<DataListDto<string>>(this.v2Url(`/${userId}/roles`))
      .pipe(map(x => x.data));
  }

  updateRoles(userId: number, roles: string[]): Observable<BooleanStatusDto> {
    return this.http.put<BooleanStatusDto>(
      this.v2Url(`/${userId}/roles`),
      { data: roles }
    );
  }

  /**
   * @deprecated Use auth service instead
   */
  // TODO: we need to unset the user but we also don't want this logic here.
  logout(redirectHome: boolean = true) {
    this._user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    if (redirectHome) {
      this.router.navigate(['/']);
    }
  }

  getMe(): Observable<User> {
    return this.http.get<User>(this.url('me'));
  }

  me(): Subscription {
    return this.getMe().subscribe({
      next: (response: User) => {
        console.log(response);

        if (response) {
          this._user = response;
          if (!this._user.email) {
            this.router.navigate(['user/new']);
          }
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      },
      error: (error: Error) => {
        console.log(error);
        this._user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      },
    });
  }

  update(user: User) {
    return this.http.patch(this.url(`${user.id}`), user).subscribe({
      next: () => {
        if (!user.enabled) {
          this.translateService.get('alert.user.deactivate.success').subscribe((res: string) => {
            this.toast(res);
          });
          this.logout();
          return;
        }
        this._user = {...this._user, ...user};
        localStorage.setItem('user', JSON.stringify(this._user));
        this.translateService.get('alert.user.update.success').subscribe((res: string) => {
          this.toast(res);
        });
      },
      error: () => {
        this.translateService.get('alert.user.update.error').subscribe((res: string) => {
          this.toast(res, 3000, 'warning');
        });
      },
    });
  }

  exists(name: string): Observable<ValidationErrors> {
    if (!name) {
      return new Observable();
    }

    return this.http.get<ValidationErrors>(this.url(`${name}/exists`));
  }

  searchV1(name: string): Observable<User[]> {
    return this.http.get<User[]>(this.url(`${name}/search`));
  }

  // TODO: does not exist yet
  /*search(name: string): Observable<User[]> {
    return this.http.get<User[]>(this.url(`search?q=${name}`, 'v2'));
  }*/

  ban(id: number): Observable<void> {
    return this.http.post<void>(this.url(`${id}/ban`), null);
  }

  unban(id: number): Observable<void> {
    return this.http.delete<void>(this.url(`${id}/ban`));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(this.url(`${id}`));
  }

  setEnabled(id: number, enabled: boolean): Observable<void> {
    return this.http.post<void>(this.url(`${id}/enabled?status=${enabled}`), null);
  }

  getProfile(name: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.v2Url(name));
  }

  getSubmissionHistory(id: number): Observable<DataListDto<UserProfileHistory>> {
    return this.http.get<DataListDto<UserProfileHistory>>(this.v2Url(`${id}/submission-history`));
  }

  getModerationHistory(id: number): Observable<DataListDto<HistoryMarathon>> {
    return this.http.get<DataListDto<HistoryMarathon>>(this.v2Url(`${id}/moderation-history`));
  }

  getSupporterStatus(id: number): Observable<UserSupporterStatus> {
    return this.http.get<UserSupporterStatus>(this.v2Url(`${id}/supporter-status`));
  }

  isBanned(): boolean {
    return this._user.roles.includes('ROLE_BANNED');
  }

  isAdmin(): boolean {
    return this._user.roles.includes('ROLE_ADMIN');
  }

  isLoggedIn(): boolean {
    return Boolean(this._user);
  }

  set token(value: string) {
    localStorage.setItem('token', value);
  }

  get token(): string {
    return localStorage.getItem('token');
  }

  get user(): User {
    return this._user;
  }
}
