import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { httpInterceptorProviders } from '../interceptors';
import { FormsModule } from '@angular/forms';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from '@busacca/ng-pick-datetime';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NwbAlertModule, NwbCommonModule, NwbSwitchModule } from '@wizishop/ng-wizi-bulma';
import { MarathonModule } from './marathon/marathon.module';
import { DirectivesModule } from './directives/directives.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HomepageComponent } from './homepage/homepage.component';
import { HomepageMetadataResolver } from './resolvers/next-marathons-resolver';
import { UserModule } from './user/user.module';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { OengusCommonModule } from './oengus-common/oengus-common.module';
import { AboutComponent } from './about/about.component';
import { CalendarComponent } from './calendar/calendar.component';
import { WebpackTranslateLoader } from '../loader/webpack-translate-loader';
import { PatronsComponent } from './patrons/patrons.component';
import { PatronsResolver } from './resolvers/patrons-resolver';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { KasperskyAnnouncementComponent } from './news/kaspersky-announcement/kaspersky-announcement.component';
import { ButtonsModule } from './buttons/buttons.module';
import { PlumComponent } from './plum/plum.component';
import * as Sentry from '@sentry/angular';
import { HomepageModeratedResolver } from './resolvers/homepage-moderated-resolver';
import { SignUpComponent } from './auth/sign-up/sign-up.component';
import { WelcomeComponent } from './homepage/welcome/welcome.component';
import { SponsorsComponent } from './homepage/sponsors/sponsors.component';
import { MarathonsComponent } from './homepage/marathons/marathons.component';
import { FooterBarComponent } from './_layout/footer/footer-bar/footer-bar.component';
import { FooterPatronsComponent } from './_layout/footer/footer-patrons/footer-patrons.component';
import { ElementModule } from './elements/elements.module';
import { MarathonCalendarContainerComponent } from './calendar/marathon-calendar-container/marathon-calendar-container.component';
import { CalendarControllerComponent } from './calendar/calendar-controller/calendar-controller.component';
import { CalendarViewComponent } from './calendar/calendar-view/calendar-view.component';
import { CalendarViewRowComponent } from './calendar/calendar-view-row/calendar-view-row.component';
import { ComponentsModule } from './components/components.module';
import { RouterModule, Routes } from '@angular/router';
import { AboutInfoComponent } from './about/about-info/about-info.component';
import { AboutContactComponent } from './about/about-contact/about-contact.component';
import { AboutPrivacyComponent } from './about/about-privacy/about-privacy.component';
import { HeaderBarComponent } from './_layout/header-bar/header-bar.component';
import { HeaderBarCookiesComponent } from './_layout/header-bar/header-bar-cookies/header-bar-cookies.component';
import { HeaderBarNavComponent } from './_layout/header-bar/header-bar-nav/header-bar-nav.component';
import { HeaderLanguagePickerComponent } from './_layout/header-bar/header-language-picker/header-language-picker.component';
import { LocalizeParser, LocalizeRouterModule, LocalizeRouterSettings, ManualParserLoader } from '@gilsdav/ngx-translate-router';
import { Location } from '@angular/common';
import { availableLocaleNames } from '../services/locale.service';
import { HeaderBarUserComponent } from './_layout/header-bar/header-bar-user/header-bar-user.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';
import { HeaderBarDisplayNameComponent } from './_layout/header-bar/header-bar-display-name/header-bar-display-name.component';
import { LoginComponent } from './auth/login/login.component';
import { HeaderBarVerifyEmailComponent } from './_layout/header-bar/header-bar-verify-email/header-bar-verify-email.component';
import { PasswordResetComponent } from './auth/password-reset/password-reset.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { LoginOauthComponent } from './auth/login-oauth/login-oauth.component';

const appRoutes: Routes = [
  {
    path: 'register',
    component: SignUpComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'password-reset/:token',
    component: PasswordResetComponent,
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
  },
  {
    path: 'login/:service',
    component: LoginOauthComponent,
    data: {
      skipRouteLocalization: true,
    },
  },
  {
    path: '',
    component: HomepageComponent,
    resolve: {
      homepageMetadata: HomepageMetadataResolver,
      moderatedMarathons: HomepageModeratedResolver,
    },
  },
  {
    path: 'calendar',
    component: CalendarComponent,
  },
  {
    path: 'calendar/:year/:month',
    component: CalendarComponent,
  },
  {
    path: 'about',
    component: AboutComponent,
  },
  {
    path: 'patrons',
    component: PatronsComponent,
    resolve: {
      patrons: PatronsResolver,
    },
  },
  /*{
    path: 'news/kaspersky-partnership',
    component: KasperskyAnnouncementComponent,
  },*/
  {
    path: '403',
    component: UnauthorizedComponent,
  },
  {
    path: '**',
    component: PageNotFoundComponent,
  },
];

@NgModule({
  declarations: [
    AppComponent,
    LoginOauthComponent,
    HomepageComponent,
    AboutComponent,
    PatronsComponent,
    CalendarComponent,
    PageNotFoundComponent,
    KasperskyAnnouncementComponent,
    PlumComponent,
    SignUpComponent,
    LoginComponent,
    WelcomeComponent,
    SponsorsComponent,
    MarathonsComponent,
    FooterBarComponent,
    FooterPatronsComponent,
    MarathonCalendarContainerComponent,
    CalendarControllerComponent,
    CalendarViewComponent,
    CalendarViewRowComponent,
    AboutInfoComponent,
    AboutContactComponent,
    AboutPrivacyComponent,
    HeaderBarComponent,
    HeaderBarCookiesComponent,
    HeaderBarNavComponent,
    HeaderLanguagePickerComponent,
    HeaderBarUserComponent,
    UnauthorizedComponent,
    HeaderBarDisplayNameComponent,
    HeaderBarVerifyEmailComponent,
    PasswordResetComponent,
    ForgotPasswordComponent,
    LoginOauthComponent,
  ],
  exports: [
    //
  ],
  bootstrap: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useClass: WebpackTranslateLoader,
      },
    }),
    RouterModule.forRoot(appRoutes),
    LocalizeRouterModule.forRoot(appRoutes, {
      alwaysSetPrefix: false,
      initialNavigation: false,
      cacheName: 'language',
      defaultLangFunction: (languages: string[], cachedLang?: string, browserLang?: string) => cachedLang || browserLang || 'en-GB',
      parser: {
        provide: LocalizeParser,
        useFactory: (translate, location, settings) => new ManualParserLoader(translate, location, settings, availableLocaleNames, 'YOUR_PREFIX'),
        deps: [TranslateService, Location, LocalizeRouterSettings],
      },
      // initialNavigation: true,
    }),
    FormsModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    NwbSwitchModule,
    NwbAlertModule,
    MarathonModule,
    UserModule,
    DirectivesModule,
    FontAwesomeModule,
    OengusCommonModule,
    NwbCommonModule,
    ButtonsModule,
    ElementModule,
    ComponentsModule,
  ],
  providers: [
    {
      provide: ErrorHandler,
      useValue: Sentry.createErrorHandler({
        showDialog: false, // TODO: experiment with this
      }),
    },
    httpInterceptorProviders,
    HomepageMetadataResolver,
    HomepageModeratedResolver,
    PatronsResolver,
    provideHttpClient(withInterceptorsFromDi()),
  ],
})
export class AppModule {
}

