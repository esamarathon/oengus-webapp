import { Component, OnInit } from '@angular/core';
import { User } from '../../../model/user';
import { UserService } from '../../../services/user.service';
import { faSyncAlt, faPlus } from '@fortawesome/free-solid-svg-icons';
import { ActivatedRoute, Router } from '@angular/router';
import { NwbAlertConfig, NwbAlertService } from '@wizishop/ng-wizi-bulma';
import { TranslateService } from '@ngx-translate/core';
import SocialAccount from '../../../model/social-account';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  public faSyncAlt = faSyncAlt;
  public faPlus = faPlus;

  public user: User;
  public loading = false;

  public deactivateConfirm = false;
  public deleteConfirm = false;
  public deleteUsername: string;

  constructor(public userService: UserService,
              private route: ActivatedRoute,
              private router: Router,
              private toastr: NwbAlertService,
              private translateService: TranslateService) {
    this.user = {...this.route.snapshot.data.user};
    localStorage.setItem('user', JSON.stringify(this.user));
    this.route.params.subscribe(params => {
      this.route.queryParams.subscribe(queryParams => {
        if (!!params['service'] && (!!queryParams['code'] || !!queryParams['oauth_token'] && !!queryParams['oauth_verifier'])) {
          this.syncService(params, queryParams);
        }
      });
    });
  }

  ngOnInit() {

  }

  addNewConnection() {
    this.user.connections.push({
      platform: '',
      username: '',
    });
  }

  deleteConnection(connection: SocialAccount) {
    const conns = this.user.connections;

    const index = conns.indexOf(connection);

    if (index > -1) {
      conns.splice(index, 1);
    }
  }
  syncDiscord() {
    delete this.user.discordId;
    delete this.user.discordName;

    window.location.assign(this.userService.getDiscordAuthUri(true));
  }

  syncTwitch() {
    delete this.user.twitchId;

    window.location.assign(this.userService.getTwitchAuthUrl(true));
  }

  syncTwitter() {
    this.loading = true;
    delete this.user.twitterId;

    this.userService.sync('twitterAuth').subscribe(response => {
      window.location.replace(response.token);
    });
  }

  unsyncDiscord() {
    delete this.user.discordId;
    delete this.user.discordName;
    this.submit();
  }

  unsyncTwitch() {
    delete this.user.twitchId;
    this.submit();
  }

  unsyncTwitter() {
    delete this.user.twitterId;
    this.submit();
  }

  submit() {
    this.loading = true;
    return new Promise((resolve) => {
      this.userService.update(this.user).add(() => {
        this.loading = false;
        localStorage.setItem('user', JSON.stringify(this.user));
        resolve();
      });
    });
  }

  deactivate() {
    this.loading = true;
    this.user.enabled = false;
    this.userService.update(this.user).add(() => {
      this.loading = false;
    });
  }

  deleteUser() {
    this.loading = true;
    this.userService.delete(this.user.id).subscribe(() => {
      this.loading = false;
      this.translateService.get('user.settings.deletingAccount.success').subscribe((res: string) => {
        this.showSuccessToast(res);
      });
      // redirects to home
      this.userService.logout();
    });
  }

  get usernameConfirmed(): boolean {
    if (!this.userService.user) {
      return false;
    }

    return this.deleteUsername === this.userService.user.username;
  }

  get title(): string {
    return 'Settings';
  }

  private syncService(params, queryParams) {
    this.loading = true;
    this.userService.sync(params['service'],
      queryParams['code'],
      queryParams['oauth_token'],
      queryParams['oauth_verifier']).subscribe(response => {
      switch (params['service']) {
        case 'discord' :
          this.user.discordId = response.id;
          this.user.discordName = response.name;
          break;
        case 'twitch' :
          this.user.twitchId = response.id;
          this.user.twitchName = response.name;
          break;
        case 'twitter' :
          this.user.twitterId = response.id;
          this.user.twitterName = response.name;
          break;
      }
      this.submit().then(() => {
        localStorage.setItem('user', JSON.stringify(this.user));
        this.router.navigate(['/user/settings']);
      });
    }, error => {
      switch (error.code) {
        case 'ACCOUNT_ALREADY_SYNCED':
          this.translateService.get('alert.user.sync.alreadySynced').subscribe((res: string) => {
            this.showWarningToast(res);
          });
          break;
        default:
          this.translateService.get('alert.user.sync.error').subscribe((res: string) => {
            this.showWarningToast(res);
          });
          break;
      }
    });
  }

  private showSuccessToast(message: string) {
    const alertConfig: NwbAlertConfig = {
      message: message,
      duration: 3000,
      position: 'is-right',
      color: 'is-success'
    };
    this.toastr.open(alertConfig);
  }

  private showWarningToast(message: string) {
    const alertConfig: NwbAlertConfig = {
      message: message,
      duration: 3000,
      position: 'is-right',
      color: 'is-warning'
    };
    this.toastr.open(alertConfig);
  }
}
