import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { UserService } from '../services/user.service';
import { faDiscord, faGithub, faPatreon, faTwitch, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { faBug, faLanguage } from '@fortawesome/free-solid-svg-icons';
import { TranslateService } from '@ngx-translate/core';
import isoLang from '../assets/languages.json';
import moment from 'moment-timezone';
import { DateTimeAdapter } from '@busacca/ng-pick-datetime';
import { environment } from '../environments/environment';
import localeEn from '@angular/common/locales/en';
import localeFr from '@angular/common/locales/fr';
import localeDe from '@angular/common/locales/de';
import localeNl from '@angular/common/locales/nl';
import localeJa from '@angular/common/locales/ja';
import localeCy from '@angular/common/locales/cy';
import localeEs from '@angular/common/locales/es';
import localePt from '@angular/common/locales/pt';
import localeEl from '@angular/common/locales/el';
import localeIt from '@angular/common/locales/it';
import localeZhHk from '@angular/common/locales/zh-Hant-HK';
import localeTr from '@angular/common/locales/tr';
import localeKo from '@angular/common/locales/ko';
import localeDa from '@angular/common/locales/da';
import localeFi from '@angular/common/locales/fi';
import localeCa from '@angular/common/locales/ca';
import localeRu from '@angular/common/locales/ru';
import { registerLocaleData, Location } from '@angular/common';
import {
  Router,
  Event as RouterEvent,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError
} from '@angular/router';
import {LoadingBarService} from '../services/loading-bar.service';
import {TitleService} from '../services/title.service';
import {NwbAlertConfig, NwbAlertService} from '@wizishop/ng-wizi-bulma';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = !environment.sandbox ? 'Oengus' : 'Oengus [Sandbox]';

  @ViewChild('navBurger', {static: true}) navBurger: ElementRef;
  @ViewChild('navMenu', {static: true}) navMenu: ElementRef;

  public faTwitter = faTwitter;
  public faDiscord = faDiscord;
  public faTwitch = faTwitch;
  public faBug = faBug;
  public faGithub = faGithub;
  public faPatreon = faPatreon;
  public faLanguage = faLanguage;
  public languages = (<any>isoLang);
  public language = localStorage.getItem('language') ? localStorage.getItem('language') : navigator.language.split('-')[0];
  public environment = environment;
  public loading = true;
  public languageBarActive = false;

  // removed languages have none to no translations
  public availableLocales = {
    'ca': localeCa,
    'cy': localeCy,
    'en': localeEn,
    'da': localeDa,
    'de': localeDe,
    'el': localeEl,
    'es': localeEs,
    'fi': localeFi,
    'fr': localeFr,
    'it': localeIt,
    'ja': localeJa,
    'ko': localeKo,
    'nl': localeNl,
    'pt_BR': localePt,
    'ru': localeRu,
    'tr': localeTr,
    'zh_Hant_HK': localeZhHk,
  };

  constructor(public userService: UserService,
              private translate: TranslateService,
              private toastr: NwbAlertService,
              private dateTimeAdapter: DateTimeAdapter<any>,
              private router: Router,
              private location: Location,
              private titleService: TitleService,
              private loader: LoadingBarService) {
    this.loader.stateObserver.subscribe((loading) => {
      this.loading = loading;
    });
    this.router.events.subscribe((event: RouterEvent) => {
      this.navigationInterceptor(event);
    });

    this.setupLanguages();

    if (!this.userService.user) {
      this.userService.me().add(() => {
        const user = this.userService.user;

        // Is this user activated?
        if (user && user.mail && !user.enabled) {
          this.userService.logout(false);
          this.translate.get('alert.user.login.disabledAccount').subscribe((res: string) => {
            const alertConfig: NwbAlertConfig = {
              message: res,
              duration: 5000,
              position: 'is-right',
              color: 'is-warning'
            };
            this.toastr.open(alertConfig);
          });
        }
      });
    }
  }

  ngOnInit(): void {
    //
  }

  acceptPrivacyConsent(): void {
    window['ga-disable-G-26CN947SSZ'] = false;
    localStorage.setItem('consent', 'true');
  }

  declinePrivacyConsent(): void {
    window['ga-disable-G-26CN947SSZ'] = true;
    localStorage.setItem('consent', 'false');
  }

  consentWasGiven(): boolean {
    return localStorage.getItem('consent') !== null;
  }

  showKasperskyBanner(): boolean {
    return localStorage.getItem('oengus_hide_kaspersky_announcement') === null;
  }

  closeKasperskyBanner(): void {
    localStorage.setItem('oengus_hide_kaspersky_announcement', 'true');
  }

  isBlockingAds(): boolean {
    return !document.getElementById('asjhdflkjashdlfkajsdfs');
  }

  setupLanguages(): void {
    for (const lang of this.availableLocaleNames) {
      registerLocaleData(this.availableLocales[lang], lang);
    }

    this.translate.setDefaultLang('en');

    if (this.language in this.availableLocales) {
      this.useLanguage(this.language);
    } else {
      this.useLanguage('en');
    }
  }

  get availableLocaleNames(): string [] {
    return Object.keys(this.availableLocales);
  }

  useLanguage(language: string): void {
    this.language = language;
    localStorage.setItem('language', language);
    this.translate.use(language);

    this.setMomentTimezone(language);

    this.dateTimeAdapter.setLocale(language.split('_')[0]);
    this.languageBarActive = false;
  }

  toggleNavbar(): void {
    this.navBurger.nativeElement.classList.toggle('is-active');
    this.navMenu.nativeElement.classList.toggle('is-active');
  }

  getTimezone(): string {
    return moment.tz.guess();
  }

  getYear(): number {
    return new Date().getFullYear();
  }

  setMomentTimezone(language: string): void {
    // Clear experiment
    const experimentName = 'oengus_experiment_2021-05-11_automatic-date-format';
    localStorage.removeItem(experimentName);

    const date = new Date();

    if (date.getMonth() === 3 && date.getDay() === 1 && date.getHours() >= 14 ) {
      moment.locale('x-pseudo');
    } else if (language === 'zh_Hant_HK') {
      moment.locale('zh_hk');
    } else {
      moment.locale(language.split('_')[0].replace('en', 'en_GB'));
    }
  }

  twitterAuth() {
    this.userService.login('twitterAuth').subscribe(response => {
      window.location.replace(response.token);
    });
  }

  onRouteActivated(component) {
    if (Object.getPrototypeOf(component).hasOwnProperty('title')) {
      this.titleService.setTitle(component.title);
    } else {
      this.titleService.resetTitle();
    }
  }

  // Shows and hides the loading spinner during RouterEvent changes
  navigationInterceptor(event: RouterEvent): void {
    if (event instanceof NavigationStart) {
      // close the navbar
      this.navBurger.nativeElement.classList.remove('is-active');
      this.navMenu.nativeElement.classList.remove('is-active');

      this.loader.setLoading(true);
    } else if (event instanceof NavigationEnd) {
      this.loader.setLoading(false);

      // Set loading state to false in both of the below events to hide the loader in case a request fails
    } else if (event instanceof NavigationCancel) {
      this.loader.setLoading(false);
    } else if (event instanceof NavigationError) {
      this.loader.setLoading(false);

      // stay on the same route if something fails
      this.router.navigate(['/404'], {skipLocationChange: true})
        .then(() =>  this.location.go(event.url));
    }
  }
}
