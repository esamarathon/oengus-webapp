# Oengus Webapp — Unit Testing Plan

> Goal: Introduce complete, maintainable unit-test coverage for **all components and
> services** in this Angular 22 application, following the official Angular testing
> guide (https://angular.dev/guide/testing) and current best practices.
>
> This document is written to be executed by an LLM (or developer) **file-by-file**.
> It contains: the current state, environment fixes required first, global
> conventions, reusable test patterns/templates for every artifact type, and a full
> inventory checklist to track progress.

---

## 1. Current State (as discovered)

| Aspect | Finding |
|---|---|
| Angular version | 22.0.7 (standalone components + legacy NgModules mixed) |
| Test runner | Karma + Jasmine (`@angular-devkit/build-angular:karma`) |
| Existing specs | **None** (`*.spec.ts` count = 0) |
| Test bootstrap | `src/test.ts` uses **outdated** APIs (see §2) |
| i18n | `@ngx-translate/core` v17 used widely in templates/components |
| Routing i18n | `@oengusio/ngx-translate-router` (`LocalizeRouterModule`, `localize` pipe) |
| HTTP | `provideHttpClient` + DI interceptors (`JwtInterceptor`) |
| Dates | `Temporal` (via `temporal-polyfill`) through `TemporalServiceService` |
| State | Services hold mutable state (e.g. `MarathonService.marathon`, `UserService.user`) |
| Auth token | Stored in `localStorage` (`AuthService`, `UserService`) |

### Inventory counts
- **Services:** ~21 (`src/services/*.ts` + `src/services/termporal/*`)
- **Components:** ~136 (`src/app/**/*.component.ts`)
- **Pipes:** 1 (`markdown.pipe.ts`)
- **Directives:** 7 (`src/app/directives/*` — mostly async form validators)
- **Guards:** 7 (`src/app/guards/*`)
- **Resolvers:** 18 (`src/app/resolvers/*`)
- **Interceptors:** 1 (`src/interceptors/jwt-interceptor.ts`)
- **Utils:** `src/utils/helpers.ts`, `src/utils/authHelpers.ts` (pure functions — test first, cheap wins)

---

## 2. Prerequisite: Fix the Test Environment (do this FIRST)

The current `src/test.ts` will not run under Angular 22. Replace it:

```typescript
// src/test.ts
import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);
```

Additional checks before writing specs:
1. Confirm `src/tsconfig.spec.json` includes `**/*.spec.ts` and the `jasmine`/`node` types.
2. `angular.json > test.options.styles` references `src/styles.css` but the app uses
   `src/styles.scss`. Change it to `src/styles.scss` (or remove) so `ng test` builds.
3. Add a headless CI script to `package.json`:
   ```json
   "test:ci": "ng test --watch=false --browsers=ChromeHeadless --code-coverage"
   ```
4. Consider a `ChromeHeadlessCI` custom launcher in `karma.conf.js` with
   `--no-sandbox` for CI containers.

**Definition of done for §2:** `npm run test:ci` runs green with zero specs before any
component/service spec is added.

---

## 3. Global Conventions

- **File location:** co-locate `foo.spec.ts` next to `foo.ts`.
- **Naming:** top-level `describe('FooComponent', () => …)`; use nested `describe`
  per method; `it('should …')` phrasing.
- **AAA:** structure every test as Arrange / Act / Assert.
- **No real HTTP / no real timers / no real router navigation.** Always mock.
- **Prefer `HttpTestingController`** (`provideHttpClientTesting`) for services.
- **Prefer spies over full dependency instances** for components.
- **Isolate `localStorage`:** in `beforeEach`, `localStorage.clear()` (or spy on it).
- **Deterministic dates:** inject/stub `TemporalServiceService`; never rely on real `now`.
- **Coverage target:** ≥ 80% statements for services & pure utils; ≥ 70% for components.
  Focus on behavior, not lines — do not write assertion-free "it renders" tests only.

### 3.1 Shared test helpers (create these once)

Create `src/testing/` with reusable helpers so every spec stays short:

- `src/testing/translate-testing.module.ts` — a `TranslateModule.forRoot` using a
  fake loader that returns keys unchanged (so templates render `alert.x.y` literally):

```typescript
// src/testing/translate-testing.ts
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

class FakeLoader implements TranslateLoader {
  getTranslation() { return of({}); }
}

export const TranslateTestingModule = TranslateModule.forRoot({
  loader: { provide: TranslateLoader, useClass: FakeLoader },
});
```

- `src/testing/mocks.ts` — factory functions returning typed mock model objects
  (`makeMarathon()`, `makeSelfUser()`, `makeSubmission()`, …). Build these from the
  interfaces in `src/model/`. Keeps specs DRY and type-safe.
- `src/testing/service-spies.ts` — factory helpers that return
  `jasmine.SpyObj<T>` for the heavy services (`UserService`, `MarathonService`,
  `NotificationService`, `TranslateService`, `Router`, `TemporalServiceService`).

---

## 4. Testing Patterns by Artifact Type

### 4.1 Pure utility functions (`src/utils/*`) — START HERE (highest ROI)
No TestBed needed. Import and assert directly.

```typescript
import { parseMastodonUrl } from './helpers';

describe('helpers', () => {
  describe('parseMastodonUrl', () => {
    it('should convert @user@instance to a profile URL', () => {
      expect(parseMastodonUrl('@a@mastodon.social'))
        .toBe('https://mastodon.social/@a');
    });
    it('should handle empty / malformed input gracefully', () => {
      expect(parseMastodonUrl('')).toBe('');
    });
  });
});
```
Cover every exported function in `helpers.ts` and `authHelpers.ts`, including edge
cases (null/empty/whitespace/invalid formats).

### 4.2 Services WITHOUT HTTP (pure logic)
E.g. `duration.service`, `locale.service`, parts of `AuthService`
(token parsing, URL builders), `MarathonService.isAdmin/isArchived/hasDstChange`.

```typescript
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

describe('AuthService (pure logic)', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: NotificationService, useValue: jasmine.createSpyObj('NotificationService', ['toastRaw']) },
        // provideHttpClient + testing when methods hit HTTP (see 4.3)
      ],
    });
    service = TestBed.inject(AuthService);
    localStorage.clear();
  });

  it('isTokenExpired returns true for a past exp claim', () => {
    const past = Math.floor(Date.now() / 1000) - 100;
    service.token = `x.${btoa(JSON.stringify({ exp: past }))}.y`;
    expect(service.isTokenExpired()).toBeTrue();
  });

  it('getDiscordAuthUri uses the sync redirect when sync=true', () => {
    expect(service.getDiscordAuthUri(true)).toContain('discord.com/oauth2/authorize');
  });
});
```
Key cases for `AuthService`: `tokenExpirationDate` with/without `exp`,
`shouldRenewToken` boundary (~1 day), all `get*AuthUrl` builders, token get/set via
`localStorage`.

### 4.3 Services WITH HTTP — use `HttpTestingController`
Template applicable to: `marathon`, `user`, `category`, `donation`, `game`,
`incentive`, `schedule`, `selection`, `submission`, `saved-games`, `patreon`,
`misc`, `title`, `auth` (HTTP methods).

```typescript
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MarathonService } from './marathon.service';
import { environment } from '../environments/environment';

describe('MarathonService', () => {
  let service: MarathonService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        // spies for Router, UserService, TranslateService, TemporalServiceService, NotificationService
      ],
    });
    service = TestBed.inject(MarathonService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('find() GETs the marathon and maps dates via TemporalService', () => {
    let result: any;
    service.find('ABC').subscribe(m => (result = m));

    const req = http.expectOne(`${environment.api}/v1/marathons/ABC`);
    expect(req.request.method).toBe('GET');
    req.flush({ startDate: '2026-01-01T00:00:00Z', endDate: '2026-01-02T00:00:00Z' });

    expect(result.startDate).toBeDefined(); // mapped by temporal spy
  });
});
```
For each HTTP service, test: correct URL (`v1Url`/`v2Url`/`url` from `BaseService`),
HTTP method, request body, query params (`HttpParams`), response mapping operators
(`mapSingleMarathon`, `mapMarathonSettings`, `mapHomepage`), and **error branches**
(`req.flush(null, { status: 500, statusText: 'err' })`) where the service reacts
(e.g. toast + navigation in `MarathonService.create/delete/publishSelection`).

> Note: methods that call `.subscribe()` internally and `router.navigate` (e.g.
> `create`, `delete`) require spying on `Router` and `TranslateService.get`
> (return `of('translated')`). Assert navigation args and toast calls.

### 4.4 `BaseService`
Test the URL builders directly via a tiny test subclass exposing the protected
methods: `url()` version handling, `v1Url`/`v2Url`, trailing-slash stripping, and
`base` prefixing. Uses `environment.api`.

### 4.5 Components — standalone (majority)
Most components are `standalone: true` with `imports: [...]`. Use
`TestBed.configureTestingModule({ imports: [TheComponent, TranslateTestingModule], providers: [...spies] })`
and **override** heavy child imports where needed.

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { Router } from '@angular/router';
import { TranslateTestingModule } from '../../../testing/translate-testing';
import { of, throwError } from 'rxjs';
import { LoginResponseStatus } from '../../../model/auth';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let auth: jasmine.SpyObj<AuthService>;
  let user: jasmine.SpyObj<UserService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    auth = jasmine.createSpyObj('AuthService', ['performLogin']);
    user = jasmine.createSpyObj('UserService', ['me'], { user: {} });
    router = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, TranslateTestingModule],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: UserService, useValue: user },
        { provide: Router, useValue: router },
        { provide: NotificationService, useValue: jasmine.createSpyObj('NotificationService', ['toast']) },
      ],
    })
      // Neutralize the localize router if its pipe/directive is used in the template:
      .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('lowercases username and calls performLogin', () => {
    auth.performLogin.and.returnValue(of({ status: LoginResponseStatus.MFA_REQUIRED } as any));
    component.loginData.username = 'ADMIN';
    component.performLogin();
    expect(auth.performLogin).toHaveBeenCalled();
    expect(component.loginData.username).toBe('admin');
    expect(component.mfaNeeded).toBeTrue();
  });

  it('sets loginError on server error and navigates on reset-required', () => {
    auth.performLogin.and.returnValue(
      throwError(() => ({ error: { status: LoginResponseStatus.PASSWORD_RESET_REQUIRED } })),
    );
    component.performLogin();
    expect(component.loginError).toBe(LoginResponseStatus.PASSWORD_RESET_REQUIRED);
    expect(router.navigate).toHaveBeenCalledWith(['/forgot-password']);
  });
});
```

Component testing checklist (per component):
1. **Creates successfully** (smoke test) — cheap guardrail.
2. **`@Input()` handling** — set inputs (via `fixture.componentRef.setInput` for
   signal inputs, or property assignment for `@Input`), `detectChanges`, assert DOM/state.
3. **`@Output()` emissions** — subscribe to the `EventEmitter`, trigger the action,
   assert emitted value.
4. **User interactions** — query with `fixture.debugElement.query(By.css(...))`,
   dispatch clicks/`ngModelChange`, assert handler side effects.
5. **Conditional rendering** — `*ngIf`/`@if` branches produce expected DOM.
6. **Async flows** — use `fakeAsync` + `tick()`/`flush()` for timers/promises, or
   subscribe-and-flush for observables.
7. **Service side effects** — assert spy calls with correct args (navigation,
   toasts, service methods).

### 4.6 Components that depend on route data / resolvers
Provide a fake `ActivatedRoute` with `snapshot.data`, `paramMap`, `parent`:

```typescript
import { ActivatedRoute, convertToParamMap } from '@angular/router';
// ...
{ provide: ActivatedRoute, useValue: {
    snapshot: { data: { marathon: makeMarathon() }, paramMap: convertToParamMap({ id: 'ABC' }) },
    paramMap: of(convertToParamMap({ id: 'ABC' })),
    parent: { snapshot: { paramMap: convertToParamMap({ id: 'ABC' }) } },
} }
```

### 4.7 Components using `NgModel` / template-driven forms
Import `FormsModule` (usually already in the component's `imports`). Set model
values, call `fixture.detectChanges()` + `await fixture.whenStable()`, then assert.

### 4.8 Components using `MarathonModule` / `ElementModule` / shared modules
Some non-standalone components are declared in feature modules
(`MarathonModule`, `UserModule`, `OengusCommonModule`, `ComponentsModule`,
`ElementModule`, `DirectivesModule`, `ButtonsModule`). For those:
`imports: [TheOwningModule, TranslateTestingModule]` and override providers.
Prefer testing at the smallest unit; use `NO_ERRORS_SCHEMA` **only as a last resort**
for deeply nested unknown child elements (document why).

### 4.9 Pipes (`MarkdownPipe`)
```typescript
import { MarkdownPipe } from './markdown.pipe';
import { MarkdownService } from '../../services/markdown.service';

describe('MarkdownPipe', () => {
  it('returns "" for falsy input', () => {
    const svc = jasmine.createSpyObj('MarkdownService', ['renderInlineSimple']);
    const pipe = new MarkdownPipe(); // if using inject(), use TestBed instead
    // With inject(): TestBed.runInInjectionContext(() => new MarkdownPipe())
    // ...
  });
});
```
Because `MarkdownPipe` uses `inject(MarkdownService)`, construct it inside
`TestBed.runInInjectionContext(() => new MarkdownPipe())` with a mocked
`MarkdownService`. Assert: empty/null → `''`; non-empty → delegates to
`renderInlineSimple` and returns its value.

### 4.10 Directives (async form validators)
All 7 directives are validators using `inject(...Service)`. Test the `validate()`
method directly by constructing the directive in an injection context and passing a
fake `AbstractControl` (`{ value: 'x' } as AbstractControl`). Mock the backing
service to return `of({ exists: true })` etc.

```typescript
TestBed.configureTestingModule({ providers: [
  MarathonExistsValidatorDirective,
  { provide: MarathonService, useValue: marathonSpy },
]});
const dir = TestBed.inject(MarathonExistsValidatorDirective);
marathonSpy.exists.and.returnValue(of({ exists: true }));
dir.validate({ value: 'foo' } as any).subscribe(res =>
  expect(res).toEqual({ exists: true }));
```
Cover both branches around `previousMarathonName`.

### 4.11 Guards (`CanActivate*`)
Guards use `inject()` and expose a functional wrapper. Test the **class method**
directly with spied `UserService`, `MarathonService`, `Router`.

```typescript
it('redirects to /403 when no token', async () => {
  userSpy.token = '';
  const guard = TestBed.inject(CanActivateMarathonSubmitGuard);
  await guard.canActivate({ parent: { paramMap: convertToParamMap({}) } } as any);
  expect(routerSpy.navigate).toHaveBeenCalledWith(['/403'], { skipLocationChange: true });
});
```
For each guard, cover: token missing, already-loaded state fast path, the
`forkJoin` lazy-load path (mock `getMe`/`find` with `of(...)`), the `catchError`
false path, and the `condition()` truth table (roles, banned, canEdit*).
Wrap async assertions with `fakeAsync`/`await` as appropriate.

### 4.12 Resolvers
Resolvers delegate to a service. Provide a spy service returning `of(mock)` and a
fake `ActivatedRouteSnapshot`, then assert the resolver returns/forwards it.

```typescript
const res = TestBed.runInInjectionContext(() =>
  new MarathonResolver().resolve({ paramMap: convertToParamMap({ id: 'ABC' }) } as any));
```
Cover missing-param default (`?? ''`) and pass-through of the service observable.

### 4.13 Interceptor (`JwtInterceptor`)
Test via `HttpTestingController` with the interceptor registered, or unit-test
`intercept()` directly with a fake `HttpHandler`.

```typescript
it('adds oengus-version header always and Authorization when token exists', () => {
  const userSpy = { token: 'abc' } as UserService;
  TestBed.configureTestingModule({ providers: [
    provideHttpClient(withInterceptorsFromDi()),
    provideHttpClientTesting(),
    { provide: UserService, useValue: userSpy },
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
  ]});
  const http = TestBed.inject(HttpClient);
  const ctrl = TestBed.inject(HttpTestingController);
  http.get('/x').subscribe();
  const req = ctrl.expectOne('/x');
  expect(req.request.headers.get('oengus-version')).toBe('1');
  expect(req.request.headers.get('Authorization')).toBe('Bearer abc');
});
```
Also cover the no-token branch (no `Authorization` header).

---

## 5. Mocking Cheat-Sheet (project-specific)

| Dependency | How to mock |
|---|---|
| `HttpClient` | `provideHttpClient()` + `provideHttpClientTesting()` + `HttpTestingController` |
| `Router` | `jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl'])` |
| `ActivatedRoute` | Fake object with `snapshot`, `paramMap`, `parent`, `data` (see §4.6) |
| `TranslateService` | Spy: `get`/`instant`/`stream` return `of(key)` / `key` |
| `NotificationService` | `jasmine.createSpyObj('NotificationService', ['toast', 'toastRaw'])` |
| `UserService` | Spy with `user`, `token` props + `getMe`/`me`/`isBanned` methods |
| `MarathonService` | Spy with `marathon` prop + `find`/`exists`/… returning `of(...)` |
| `TemporalServiceService` | Spy `parseDate` returns a fixed `Temporal.ZonedDateTime`; stub `now`, `timeZone` |
| `MarkdownService` | Spy `renderInlineSimple`/`render` returns input echoed |
| `localStorage` | `localStorage.clear()` in `beforeEach`, or `spyOn(localStorage, 'getItem')` |
| `environment` | Import real one; assert URLs contain `environment.api` |
| Sentry `ErrorHandler` | Not needed in unit tests; don't import `AppModule` |
| `@sentry/angular` | Avoid pulling into specs; test components/services in isolation |

**Anti-pattern to avoid:** importing `AppModule` in specs (drags in Sentry, router,
full i18n). Always assemble the minimal TestBed.

---

## 6. Execution Order / Prioritization

Work in waves; each wave is independently mergeable and keeps the suite green.

1. **Wave 0 — Environment (§2).** Fix `test.ts`, `angular.json` styles, add CI script,
   create `src/testing/` helpers. Gate: empty suite runs green.
2. **Wave 1 — Pure utils & non-HTTP logic.** `utils/helpers`, `utils/authHelpers`,
   `duration.service`, `AuthService` (token/url logic), `BaseService`,
   `locale.service`. Highest ROI, no DOM.
3. **Wave 2 — HTTP services.** All services in §4.3 with `HttpTestingController`.
4. **Wave 3 — Cross-cutting.** Interceptor, all directives, all guards, all resolvers,
   `MarkdownPipe`.
5. **Wave 4 — Leaf/presentational components.** `elements/*`, `oengus-common/*`,
   `buttons/*`, `components/wizi/*`, small display components (inputs/outputs only).
6. **Wave 5 — Feature components.** `auth/*`, `homepage/*`, `_layout/*`, `calendar/*`,
   `about/*`, `patrons`, `user/*`.
7. **Wave 6 — Complex marathon feature.** `marathon/**` (schedule-management editors,
   submissions, settings) — the largest & most interactive; do last, one folder at a time.

---

## 7. Per-Wave "Definition of Done"
- New specs pass under `npm run test:ci` (ChromeHeadless, `--watch=false`).
- No `console.error`/`console.warn` leaks (unhandled observable/timer). Use
  `fakeAsync` + `flush()` to drain.
- `http.verify()` in `afterEach` for every HTTP spec (no outstanding requests).
- Meaningful assertions (behavior), not just `expect(component).toBeTruthy()`.
- Coverage does not regress; trends upward toward §3 targets.

---

## 8. Full Inventory Checklist

> Tick each box when a meaningful spec exists and passes. Grouped by wave.

### Utils & core (Wave 1)
- [ ] `src/utils/helpers.ts`
- [ ] `src/utils/authHelpers.ts`
- [ ] `src/services/BaseService.ts`
- [ ] `src/services/auth.service.ts` (token + url logic)
- [ ] `src/services/duration.service.ts`
- [ ] `src/services/locale.service.ts`
- [ ] `src/services/termporal/temporal-service.service.ts`

### HTTP / stateful services (Wave 2)
- [ ] `auth.service.ts` (HTTP methods)
- [ ] `marathon.service.ts`
- [ ] `user.service.ts`
- [ ] `category.service.ts`
- [ ] `donation.service.ts`
- [ ] `game.service.ts`
- [ ] `incentive.service.ts`
- [ ] `schedule.service.ts`
- [ ] `selection.service.ts`
- [ ] `submission.service.ts`
- [ ] `saved-games.service.ts`
- [ ] `patreon.service.ts`
- [ ] `misc.service.ts`
- [ ] `title.service.ts`
- [ ] `markdown.service.ts`
- [ ] `notification.service.ts`
- [ ] `loading-bar.service.ts`

### Cross-cutting (Wave 3)
- [ ] `src/interceptors/jwt-interceptor.ts`
- [ ] `pipes/markdown.pipe.ts`
- [ ] `directives/marathon-exists-validator.directive.ts`
- [ ] `directives/schedule-slug-exists-validator.directive.ts`
- [ ] `directives/username-exists-validator.directive.ts`
- [ ] `directives/max-number-validator.directive.ts`
- [ ] `directives/min-number-validator.directive.ts`
- [ ] `directives/min-duration-validator.directive.ts`
- [ ] `directives/total-validator.directive.ts`
- [ ] `guards/can-activate-marathon-active-guard.service.ts`
- [ ] `guards/can-activate-marathon-donations-guard.service.ts`
- [ ] `guards/can-activate-marathon-incentives-guard.service.ts`
- [ ] `guards/can-activate-marathon-settings-guard.service.ts`
- [ ] `guards/can-activate-marathon-submit-guard.service.ts`
- [ ] `guards/deactivate-route-guard.service.ts`
- [ ] `guards/is-email-verified-guard.guard.ts`
- [ ] `resolvers/availabilities-resolver.ts`
- [ ] `resolvers/donations-resolver.ts`
- [ ] `resolvers/donations-stats-resolver.ts`
- [ ] `resolvers/homepage-moderated-resolver.ts`
- [ ] `resolvers/incentives-resolver.ts`
- [ ] `resolvers/marathon-resolver.ts`
- [ ] `resolvers/marathon-settings-resolver.resolver.ts`
- [ ] `resolvers/moderators.resolver.ts`
- [ ] `resolvers/next-marathons-resolver.ts`
- [ ] `resolvers/patrons-resolver.ts`
- [ ] `resolvers/questions-resolver.resolver.ts`
- [ ] `resolvers/schedule-by-id-resolver.ts`
- [ ] `resolvers/schedule-by-slug-resolver.ts`
- [ ] `resolvers/schedule-overview-resolver.ts`
- [ ] `resolvers/selection-resolver.ts`
- [ ] `resolvers/submission-resolver.ts`
- [ ] `resolvers/user-profile-resolver.ts`
- [ ] `resolvers/user-resolver.ts`

### Components (Waves 4–6)
> ~136 components under `src/app/**/*.component.ts`. Track by folder; every
> `*.component.ts` gets a co-located `*.component.spec.ts`.

- [ ] `app.component.ts`
- [ ] `elements/**` (element-*, temporal/*, loading-indicator, user-link, marathon-location)
- [ ] `oengus-common/**` (user, monetary-amount, delete-button)
- [ ] `buttons/**`
- [ ] `components/**` (wizi/switch, wizi/alert, oengus-md, simple-md, patron-list,
      notification-list, widget-signin-picker, marathon-sidebar-overview)
- [ ] `auth/**` (login, sign-up, password-reset, forgot-password, login-oauth)
- [ ] `_layout/**` (header-bar & children, footer & children)
- [ ] `homepage/**` (homepage, welcome, sponsors, marathons, security-popup)
- [ ] `calendar/**` (calendar, controllers, views, container)
- [ ] `about/**`, `patrons/**`, `privacy-policy/**`, `page-not-found/**`, `unauthorized/**`
- [ ] `user/**` (settings & children, profile & children, new-user, saved-games-settings, management-dialog)
- [ ] `marathon/**` — split per sub-area:
  - [ ] `marathon/layout/**`
  - [ ] `marathon/home/**`
  - [ ] `marathon/submit/**`
  - [ ] `marathon/submissions/**`
  - [ ] `marathon/settings/**`
  - [ ] `marathon/schedule/**`
  - [ ] `marathon/schedule-management/**` (create, edit + editors, overview, warning-modal)
  - [ ] `marathon/selection`, `marathon/donations`, `marathon/donate`,
        `marathon/incentive`, `marathon/incentive-management`, `marathon/new-marathon`,
        `marathon/marathon.component`

---

## 9. Reference: Angular testing APIs used here
- `TestBed.configureTestingModule` / `TestBed.inject` / `TestBed.createComponent`
- `TestBed.runInInjectionContext` (for `inject()`-based pipes/directives/resolvers)
- `ComponentFixture`, `fixture.detectChanges()`, `fixture.whenStable()`,
  `fixture.componentRef.setInput()`
- `DebugElement` + `By.css` for DOM queries and event dispatch
- `fakeAsync`, `tick`, `flush`, `flushMicrotasks`, `discardPeriodicTasks`
- `provideHttpClient` + `provideHttpClientTesting` + `HttpTestingController`
- `jasmine.createSpyObj`, `spyOn`, `and.returnValue`, `and.callFake`
- RxJS test doubles: `of(...)`, `throwError(() => …)`

---

_End of plan. Execute wave-by-wave; keep the suite green after every file._

