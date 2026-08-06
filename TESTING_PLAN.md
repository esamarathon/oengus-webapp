# Oengus Webapp — Unit Testing Plan

> Goal: Introduce complete, maintainable unit-test coverage for **all components and
> services** in this Angular 22 application, following the official Angular testing
> guide (https://angular.dev/guide/testing) and current best practices.
>
> Angular 22 uses **Vitest** as the default test framework. This plan migrates from
> the legacy Karma/Jasmine setup to Vitest, then adds tests incrementally in small,
> independently mergeable steps.
>
> **Important:** When unsure about any package, API, or configuration, consult the
> official Angular documentation or ask the user for current docs. Do NOT rely on
> potentially outdated knowledge. Angular's tooling evolves rapidly — always verify
> against the source before implementing.

---

## 1. Current State

| Aspect | Finding |
|---|---|
| Angular version | 22.0.7 (standalone components + legacy NgModules mixed) |
| Test runner | **Karma + Jasmine** (legacy — to be replaced with Vitest) |
| Existing specs | **None** (`*.spec.ts` count = 0) |
| Test bootstrap | `src/test.ts` (zone.js import fixed, but file will be removed) |
| i18n | `@ngx-translate/core` v17 used widely in templates/components |
| Routing i18n | `@oengusio/ngx-translate-router` (`LocalizeRouterModule`, `localize` pipe) |
| HTTP | `provideHttpClient` + DI interceptors (`JwtInterceptor`) |
| Dates | `Temporal` (via `temporal-polyfill`) through `TemporalServiceService` |
| State | Services hold mutable state (e.g. `MarathonService.marathon`, `UserService.user`) |
| Auth token | Stored in `localStorage` (`AuthService`, `UserService`) |

### Inventory counts
- **Services:** ~28 (`src/services/**/*.ts`)
- **Components:** 136 (`src/app/**/*.component.ts`)
- **Pipes:** 1 (`markdown.pipe.ts`)
- **Directives:** 7 (`src/app/directives/*`)
- **Guards:** 7 (`src/app/guards/*`)
- **Resolvers:** 18 (`src/app/resolvers/*`)
- **Interceptors:** 1 (`src/interceptors/jwt-interceptor.ts`)
- **Utils:** `src/utils/helpers.ts`, `src/utils/authHelpers.ts`

---

## 2. Step 1: Migrate from Karma/Jasmine to Vitest

Following the official Angular migration guide:
https://angular.dev/guide/testing/migrating-to-vitest

### 2.1 Install Vitest and jsdom

```bash
npm install --save-dev vitest jsdom
```

No third-party Angular adapter needed — Angular's own `@angular/build:unit-test`
builder handles TestBed integration natively.

### 2.2 Update angular.json

Change the test target builder. Remove the entire existing `test` block (including
all Karma-specific options like `polyfills`, `assets`, `styles`, `main`,
`karmaConfig`) and replace with:

```json
"test": {
  "builder": "@angular/build:unit-test"
}
```

The builder defaults to `tsConfig: "tsconfig.spec.json"` and
`buildTarget: "::development"` (meaning: compile using the project's `build`
target with the `development` configuration). No explicit options needed unless
your setup differs.

### 2.3 Update tsconfig.spec.json

Remove the `"files": ["test.ts", "polyfills.ts"]` entry (no longer needed).
Add `"vitest/globals"` to the `types` array:

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "outDir": "../out-tsc/spec",
    "types": ["vitest/globals", "node"]
  },
  "include": ["**/*.spec.ts", "**/*.d.ts"]
}
```

### 2.4 Remove Karma/Jasmine dependencies and files

Uninstall packages:
```bash
npm uninstall karma karma-chrome-launcher karma-coverage-istanbul-reporter karma-jasmine karma-jasmine-html-reporter jasmine-core jasmine-spec-reporter @types/jasmine @types/jasminewd2
```

Delete files:
- `src/karma.conf.js`
- `src/test.ts`

### 2.5 Update package.json scripts

```json
"test": "ng test",
"test:ci": "ng test --no-watch"
```

### 2.6 Browser testing with Playwright (Firefox + Chrome)

Install the Playwright browser provider:

```bash
npm install --save-dev @vitest/browser-playwright
```

Configure `angular.json` to run tests in both Chromium and Firefox:

```json
"test": {
  "builder": "@angular/build:unit-test",
  "options": {
    "tsConfig": "src/tsconfig.spec.json",
    "buildTarget": "::development",
    "browsers": ["chromium", "firefox"]
  }
}
```

Headless mode activates automatically when the `CI` environment variable is set.
For explicit headless in CI scripts, use browser names suffixed with `Headless`
(e.g. `"ChromiumHeadless"`, `"FirefoxHeadless"`).

### 2.7 Fake timers (replacing fakeAsync)

`fakeAsync` from `@angular/core/testing` **cannot be used with Vitest** — no
`zone.js` patch is applied. Use Vitest's native fake timers instead:

```typescript
vi.useFakeTimers();
// ... create component, trigger async work ...
await vi.runAllTimersAsync();
// ... assertions ...
vi.useRealTimers();
```

Always call `vi.useRealTimers()` in `afterEach` to avoid leaking fake timers.

### 2.8 Code coverage

Install the coverage provider:

```bash
npm install --save-dev @vitest/coverage-v8
```

Add coverage options to `angular.json` (can be added later, after tests exist):

```json
"test": {
  "builder": "@angular/build:unit-test",
  "options": {
    "coverage": true,
    "coverageReporters": ["html", "lcov"],
    "coverageThresholds": {
      "statements": 80,
      "branches": 80,
      "functions": 80,
      "lines": 80
    },
    "coverageExclude": ["src/testing/**"]
  }
}
```

- `ng test --coverage` generates a `coverage/` directory with an HTML report.
- Thresholds cause CI to fail if coverage drops below the configured minimums.
- `lcov` output integrates with Codecov/Coveralls/SonarQube.

### 2.9 (Optional) Custom Vitest config

If needed later, add `runnerConfig` to angular.json options pointing to a
`vitest.config.ts`. The CLI will override `test.projects` and `test.include`
automatically.

### 2.10 Verify

Run `npm run test` — it should complete with 0 test suites found and no errors.
This confirms the Vitest pipeline is wired up correctly before any specs exist.

**Definition of done for Step 1:** `npm run test:ci` exits 0 with no specs.

---

## 3. Step 2: Create shared test helpers

Create `src/testing/` with reusable helpers so every spec stays short:

### 3.1 `src/testing/translate-testing.ts`

```typescript
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

class FakeLoader implements TranslateLoader {
  getTranslation() { return of({}); }
}

export const TranslateTestingModule = TranslateModule.forRoot({
  loader: { provide: TranslateLoader, useClass: FakeLoader },
});
```

### 3.2 `src/testing/mocks.ts`

Factory functions returning typed mock model objects (`makeMarathon()`,
`makeSelfUser()`, `makeSubmission()`, …). Built from interfaces in `src/model/`.

### 3.3 `src/testing/test-providers.ts`

Global providers that can be reused across specs:

```typescript
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

export const commonTestProviders = [
  provideHttpClient(),
  provideHttpClientTesting(),
];
```

---

## 4. Global Conventions

- **File location:** co-locate `foo.spec.ts` next to `foo.ts`.
- **Naming:** top-level `describe('FooComponent', () => …)`; nested `describe`
  per method; `it('should …')` phrasing.
- **AAA:** structure every test as Arrange / Act / Assert.
- **Vitest APIs:** use `describe`, `it`, `expect`, `vi.fn()`, `vi.spyOn()`,
  `beforeEach`, `afterEach` — these are globals via `globals: true`.
- **Type-safe mocks:** use `Mocked<T>` from Vitest for stub objects.
- **Mock lifecycle:** use `mockReturnValue()` for controlled returns; call
  `mockClear()` in `afterEach` to reset spy state between tests.
- **No real HTTP / no real timers / no real router navigation.** Always mock.
- **No `fakeAsync`:** use `vi.useFakeTimers()` + `await vi.runAllTimersAsync()`.
- **Prefer `HttpTestingController`** (`provideHttpClientTesting`) for services.
- **Prefer `vi.fn()` mocks over full dependency instances** for components.
- **Isolate `localStorage`:** in `beforeEach`, `localStorage.clear()` or spy.
- **Deterministic dates:** inject/stub `TemporalServiceService`; never rely on real `now`.
- **Change detection:** use `fixture.detectChanges(); await fixture.whenStable();` — never bare `fixture.detectChanges()` without awaiting stability. The `detectChanges()` triggers lifecycle hooks (required with zone.js), then `whenStable()` waits for async work.
- **`compileComponents()`:** only required when the component uses `@defer` blocks.
- **Page Objects:** for complex components, encapsulate DOM queries in a `Page` class
  with getter properties to reduce duplication and improve readability.
- **Debugging:** run `ng test --debug` to pause and attach VS Code or Chrome DevTools.
  For browser-specific issues, ensure Vitest browser mode is configured first.
- **Coverage target:** ≥ 80% statements for services & pure utils; ≥ 70% for components.

---

## 5. Testing Patterns by Artifact Type

### 5.1 Pure utility functions (`src/utils/*`) — START HERE

No TestBed needed. Import and assert directly.

```typescript
import { describe, it, expect } from 'vitest';
import { parseMastodonUrl } from './helpers';

describe('helpers', () => {
  describe('parseMastodonUrl', () => {
    it('should convert @user@instance to a profile URL', () => {
      expect(parseMastodonUrl('@duncte123@tech.lgbt'))
        .toBe('https://tech.lgbt/@duncte123');
    });
    it('should handle empty input gracefully', () => {
      expect(parseMastodonUrl('')).toBe('');
    });
  });
});
```

### 5.2 Services WITHOUT HTTP (pure logic)

```typescript
import { describe, it, expect, beforeEach, afterEach, vi, Mocked } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

describe('AuthService (pure logic)', () => {
  let service: AuthService;
  let notificationStub: Mocked<Pick<NotificationService, 'toastRaw'>>;

  beforeEach(() => {
    notificationStub = { toastRaw: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: NotificationService, useValue: notificationStub },
      ],
    });
    service = TestBed.inject(AuthService);
    localStorage.clear();
  });

  afterEach(() => {
    notificationStub.toastRaw.mockClear();
  });

  it('isTokenExpired returns true for a past exp claim', () => {
    const past = Math.floor(Date.now() / 1000) - 100;
    service.token = `x.${btoa(JSON.stringify({ exp: past }))}.y`;
    expect(service.isTokenExpired()).toBe(true);
  });
});
```

### 5.3 Services WITH HTTP — use `HttpTestingController`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MarathonService } from './marathon.service';

describe('MarathonService', () => {
  let service: MarathonService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        // mock dependencies with vi.fn()
      ],
    });
    service = TestBed.inject(MarathonService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('find() GETs the marathon by id', () => {
    let result: any;
    service.find('abc').subscribe(m => (result = m));
    const req = http.expectOne(/\/v1\/marathons\/abc/);
    expect(req.request.method).toBe('GET');
    req.flush({ startDate: '2026-01-01T00:00:00Z' });
    expect(result.startDate).toBeDefined();
  });
});
```

### 5.4 Components — standalone

```typescript
import { describe, it, expect, beforeEach, vi, Mocked } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { TranslateTestingModule } from '../../../testing/translate-testing';
import { AuthService } from '...';
import { Router } from '@angular/router';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let authService: Mocked<Pick<AuthService, 'performLogin'>>;

  beforeEach(async () => {
    authService = { performLogin: vi.fn() };

    TestBed.configureTestingModule({
      imports: [LoginComponent, TranslateTestingModule],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('lowercases username before login', () => {
    component.loginData.username = 'ADMIN';
    component.performLogin();
    expect(component.loginData.username).toBe('admin');
  });
});
```

### 5.5 Routed components — `RouterTestingHarness`

Use `provideRouter` with real route configs and `RouterTestingHarness` — do NOT
mock the Angular Router directly. The harness navigates to real URLs and returns
typed component instances.

**Basic routed component:**

```typescript
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

describe('MarathonComponent', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [MarathonComponent],
      providers: [provideRouter([{ path: 'marathon/:id', component: MarathonComponent }])],
    });
    harness = await RouterTestingHarness.create();
  });

  it('reads marathon id from route param', async () => {
    const comp = await harness.navigateByUrl('/marathon/abc', MarathonComponent);
    expect(comp.marathonId).toBe('abc');
  });

  it('renders marathon name', async () => {
    await harness.navigateByUrl('/marathon/abc', MarathonComponent);
    expect(harness.routeNativeElement?.textContent).toContain('Marathon');
  });
});
```

**Testing guards via `RouterTestingHarness` (integration):**

```typescript
it('redirects to login when not authenticated', async () => {
  TestBed.configureTestingModule({
    providers: [
      { provide: UserService, useValue: { user: null } },
      provideRouter([
        { path: 'settings', component: SettingsComponent, canActivate: [authGuard] },
        { path: 'login', component: LoginComponent },
      ]),
    ],
  });
  const harness = await RouterTestingHarness.create();
  // Pass the REDIRECT TARGET component as second arg
  await harness.navigateByUrl('/settings', LoginComponent);
  expect(harness.routeNativeElement?.textContent).toContain('Login');
});
```

**Testing query params (reactive via `toSignal`):**

```typescript
it('reads search term from query params', async () => {
  const comp = await harness.navigateByUrl('/search?q=angular', SearchComponent);
  expect(comp.searchTerm()).toBe('angular');
});
```

**Testing nested routes:**

```typescript
TestBed.configureTestingModule({
  providers: [provideRouter([{
    path: 'marathon/:id',
    component: MarathonLayoutComponent,
    children: [{ path: 'submit', component: SubmitComponent }],
  }])],
});
const harness = await RouterTestingHarness.create();
await harness.navigateByUrl('/marathon/abc/submit');
expect(harness.routeNativeElement?.textContent).toContain('Submit');
```

**When NOT to use the harness:** named outlets or very complex routing logic
where a custom test host component is easier.

**Fallback — manual `ActivatedRoute` mock (simplest cases only):**

```typescript
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

// In providers:
{ provide: ActivatedRoute, useValue: {
  snapshot: { data: { marathon: makeMarathon() }, paramMap: convertToParamMap({ id: 'abc' }) },
  paramMap: of(convertToParamMap({ id: 'abc' })),
} }
```

### 5.6 Setting component inputs programmatically

Use `setInput` for signal- or decorator-based `@Input` properties:

```typescript
fixture.componentRef.setInput('hero', expectedHero);
await fixture.whenStable();
expect(fixture.nativeElement.querySelector('.name').textContent).toBe(expectedHero.name);
```

### 5.7 Pipes — direct instantiation (no TestBed)

Pure pipes have no dependencies; test them as plain classes:

```typescript
import { describe, it, expect } from 'vitest';
import { MarkdownPipe } from './markdown.pipe';

describe('MarkdownPipe', () => {
  const pipe = new MarkdownPipe(/* inject mock MarkdownService if needed */);

  it('transforms markdown to html', () => {
    expect(pipe.transform('**bold**')).toContain('<strong>bold</strong>');
  });
});
```

If a pipe has injected dependencies, use TestBed:

```typescript
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [MarkdownPipe, { provide: MarkdownService, useValue: mockMarkdownService }],
  });
  pipe = TestBed.inject(MarkdownPipe);
});
```

### 5.8 Shallow testing (nested components)

For components with many child components, use `NO_ERRORS_SCHEMA` or stub
components to avoid importing the entire dependency tree:

```typescript
import { NO_ERRORS_SCHEMA } from '@angular/core';

TestBed.configureTestingModule({
  imports: [ParentComponent],
  schemas: [NO_ERRORS_SCHEMA],
});
```

Or override imports with stubs for children you need to interact with:

```typescript
@Component({ selector: 'app-child', template: '' })
class ChildStub {}

TestBed.overrideComponent(ParentComponent, {
  set: { imports: [ChildStub] },
});
```

**Caveat:** `NO_ERRORS_SCHEMA` silently ignores misspelled selectors/attributes.
Use stubs for child components you assert against; schema for the rest.

### 5.9 Test Host pattern (input/output binding)

For components with `@Input`/`@Output`, create a test host that mirrors real usage:

```typescript
@Component({
  imports: [DashboardHeroComponent],
  template: `<dashboard-hero [hero]="hero" (selected)="onSelected($event)" />`,
})
class TestHost {
  hero = makeHero();
  selectedHero?: Hero;
  onSelected(hero: Hero) { this.selectedHero = hero; }
}

describe('DashboardHeroComponent (via host)', () => {
  it('raises selected event on click', async () => {
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
    fixture.nativeElement.querySelector('.hero').click();
    await fixture.whenStable();
    expect(fixture.componentInstance.selectedHero).toBe(fixture.componentInstance.hero);
  });
});
```

### 5.10 Attribute directives — test host pattern

Directives cannot be tested in isolation (they need a host element). Create a
minimal test component that exercises all usage variants:

```typescript
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach } from 'vitest';
import { HighlightDirective } from './highlight.directive';

@Component({
  imports: [HighlightDirective],
  template: `
    <p highlight="yellow">Explicit</p>
    <p highlight>Default</p>
    <p>No directive</p>
  `,
})
class TestHost {}

describe('HighlightDirective', () => {
  let fixture: ComponentFixture<TestHost>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
  });

  it('applies explicit color', () => {
    const des = fixture.debugElement.queryAll(By.directive(HighlightDirective));
    expect(des[0].nativeElement.style.backgroundColor).toBe('yellow');
  });

  it('applies default color when no value given', () => {
    const des = fixture.debugElement.queryAll(By.directive(HighlightDirective));
    const dir = des[1].injector.get(HighlightDirective);
    expect(des[1].nativeElement.style.backgroundColor).toBe(dir.defaultColor);
  });

  it('does not affect elements without the directive', () => {
    const bare = fixture.debugElement.query(By.css('p:not([highlight])'));
    expect(bare.nativeElement.style.backgroundColor).toBe('');
  });
});
```

**Key APIs for directive tests:**
- `By.directive(DirectiveClass)` — query elements that have the directive
- `debugElement.injector.get(Directive)` — access the directive instance
- `element.dispatchEvent(new Event('input'))` — simulate DOM events
- `fixture.componentRef.setInput()` — programmatic input to the host

### 5.11 Guards and Resolvers

Functional guards/resolvers using `inject()` should be tested with
`TestBed.runInInjectionContext`:

```typescript
it('redirects unauthenticated users', () => {
  const result = TestBed.runInInjectionContext(() => authGuard());
  expect(result).toBe(false);
});
```

---

## 6. Execution Order — Small Steps

Each step is independently mergeable. Keep the suite green after every step.

### Step 1 — Vitest migration (§2)
Remove Karma/Jasmine, install Vitest, verify empty suite runs.

### Step 2 — Shared test helpers (§3)
Create `src/testing/` with translate mock, model factories, common providers.

### Step 3 — Pure utils
- `src/utils/helpers.spec.ts`
- `src/utils/authHelpers.spec.ts`

### Step 4 — Core services (no HTTP)
- `BaseService.spec.ts` (URL builders)
- `auth.service.spec.ts` (token/URL logic only)
- `duration.service.spec.ts`
- `locale.service.spec.ts`
- `temporal-service.service.spec.ts`

### Step 5 — HTTP services (one at a time)
Each service gets its own commit:
- `marathon.service.spec.ts`
- `user.service.spec.ts`
- `category.service.spec.ts`
- `donation.service.spec.ts`
- `game.service.spec.ts`
- `incentive.service.spec.ts`
- `schedule.service.spec.ts`
- `selection.service.spec.ts`
- `submission.service.spec.ts`
- `saved-games.service.spec.ts`
- `patreon.service.spec.ts`
- `misc.service.spec.ts`
- `title.service.spec.ts`
- `markdown.service.spec.ts`
- `notification.service.spec.ts`
- `loading-bar.service.spec.ts`

### Step 6 — Cross-cutting (one at a time)
- `jwt-interceptor.spec.ts`
- `markdown.pipe.spec.ts`
- Each directive (7 specs)
- Each guard (7 specs)
- Each resolver (18 specs)

### Step 7 — Leaf/presentational components
- `elements/**`
- `oengus-common/**`
- `buttons/**`
- `components/**` (wizi/switch, alert, oengus-md, etc.)

### Step 8 — Feature components (auth, layout, homepage)
- `auth/**` (login, sign-up, password-reset, etc.)
- `_layout/**` (header-bar, footer)
- `homepage/**`
- `calendar/**`
- `about/**`, `patrons/**`, `page-not-found/**`

### Step 9 — User feature
- `user/**` (settings, profile, new-user, saved-games-settings)

### Step 10 — Marathon feature (largest — split by subfolder)
- `marathon/layout/**`
- `marathon/home/**`
- `marathon/submit/**`
- `marathon/submissions/**`
- `marathon/settings/**`
- `marathon/schedule/**`
- `marathon/schedule-management/**`
- `marathon/selection/**`, `marathon/donations/**`, `marathon/donate/**`
- `marathon/incentive/**`, `marathon/incentive-management/**`
- `marathon/new-marathon/**`, `marathon/marathon.component.spec.ts`

### Step 11 — Factories cleanup ✅
The file with all the factories has gotten quite large. It should be split up in logical files to reduce file size and cognitive load.

### Step 12 — Add `http.verify()` to all HTTP service specs ✅
§7 requires `http.verify()` in `afterEach` for every HTTP spec. Currently **none** of the 9 HTTP service specs have it:
- `src/services/marathon.service.spec.ts`
- `src/services/user.service.spec.ts`
- `src/services/category.service.spec.ts`
- `src/services/donation.service.spec.ts`
- `src/services/game.service.spec.ts`
- `src/services/incentive.service.spec.ts`
- `src/services/schedule.service.spec.ts`
- `src/services/selection.service.spec.ts`
- `src/services/submission.service.spec.ts`

Each file needs:
```typescript
afterEach(() => {
  httpTesting.verify();
});
```

### Step 13 — Replace bare `fixture.detectChanges()` with `fixture.detectChanges(); await fixture.whenStable()` ✅
§4 says "use `await fixture.whenStable()` — NOT bare `fixture.detectChanges()`". The correct pattern is
`fixture.detectChanges(); await fixture.whenStable();` — `detectChanges()` triggers lifecycle hooks (ngOnInit),
then `whenStable()` waits for async operations to settle. 7 files updated:
- `src/app/marathon/settings/settings.component.spec.ts`
- `src/app/user/saved-games-settings/saved-games-settings.component.spec.ts`
- `src/app/user/saved-games-settings/category-editor/category-editor.component.spec.ts`
- `src/app/user/saved-games-settings/game-editor/game-editor.component.spec.ts`
- `src/app/user/profile/profile.component.spec.ts`
- `src/app/user/profile/profile-history/profile-history.component.spec.ts`
- `src/app/user/management-dialog/management-dialog.component.spec.ts`

### Step 14 — Isolate `localStorage` properly in service specs ✅
§4 requires `localStorage.clear()` in `beforeEach` for specs that touch localStorage. Two files use manual `setItem`/`removeItem` without `clear()`:
- `src/services/game.service.spec.ts`
- `src/services/schedule.service.spec.ts`

Add `localStorage.clear()` to `beforeEach` in both files and remove the manual `removeItem` cleanup lines.

### Step 15 — Remove bare `expect(component).toBeTruthy()` smoke tests
§7 says "meaningful assertions (behavior), not just `expect(component).toBeTruthy()`". 80 spec files have a bare creation test as their first `it` block. These provide no value beyond what TestBed already guarantees (it throws if creation fails). Remove the `it('creates the component', …)` blocks from files that already have other behavioral assertions.

---

## 7. Per-Step "Definition of Done"

- New specs pass under `npm run test:ci` (Vitest, `--watch=false`).
- No unhandled promise/observable warnings in test output.
- `http.verify()` in `afterEach` for every HTTP spec.
- Meaningful assertions (behavior), not just `expect(component).toBeTruthy()`.
- Coverage does not regress; trends upward toward §4 targets.

---

## 8. Mocking Cheat-Sheet (Vitest edition)

### Type-safe stubs with `Mocked<T>`

```typescript
import { Mocked } from 'vitest';

const routerStub: Mocked<Pick<Router, 'navigate' | 'navigateByUrl'>> = {
  navigate: vi.fn(),
  navigateByUrl: vi.fn(),
};
```

Use `mockReturnValue()` to control return values and `mockClear()` in `afterEach`.

### Quick reference

| Dependency | How to mock |
|---|---|
| `HttpClient` | `provideHttpClient()` + `provideHttpClientTesting()` + `HttpTestingController` |
| `Router` / routing | `provideRouter([...])` + `RouterTestingHarness` (preferred) — do NOT mock Router |
| `ActivatedRoute` | Only as fallback: fake object with `snapshot`, `paramMap`, `parent` |
| `TranslateService` | `{ get: vi.fn(() => of(key)), instant: vi.fn(k => k) }` |
| `NotificationService` | `{ toast: vi.fn(), toastRaw: vi.fn() }` |
| `UserService` | Object with `user`, `token` props + `vi.fn()` methods |
| `MarathonService` | Object with `marathon` prop + `vi.fn()` methods returning `of(...)` |
| `TemporalServiceService` | `{ parseDate: vi.fn(), now: vi.fn(), timeZone: 'UTC' }` |
| `MarkdownService` | `{ renderInlineSimple: vi.fn(x => x), render: vi.fn(x => x) }` |
| `localStorage` | `localStorage.clear()` in `beforeEach`, or `vi.spyOn(Storage.prototype, 'getItem')` |
| Timers / async | `vi.useFakeTimers()` + `await vi.runAllTimersAsync()` + `vi.useRealTimers()` |

---

## 9. Reference: Key Vitest + Angular Testing APIs

### Angular testing — TestBed

- `TestBed.configureTestingModule({ imports, providers, schemas })` — configure test module
- `TestBed.inject(Service)` — get service from injector (optional 2nd arg for fallback)
- `TestBed.createComponent(Component)` — create fixture (freezes config)
- `TestBed.runInInjectionContext(fn)` — run functional guards/resolvers/pipes
- `TestBed.overrideComponent(Comp, { set: { providers, imports } })` — override component-level DI
- `TestBed.compileComponents()` — only needed for `@defer` blocks

### Angular testing — ComponentFixture

- `fixture.componentInstance` — the component class instance
- `await fixture.whenStable()` — trigger change detection + wait for async
- `fixture.componentRef.setInput('name', value)` — programmatic input binding
- `fixture.nativeElement` / `fixture.debugElement` — DOM access
- `fixture.changeDetectorRef` — for OnPush components
- `fixture.autoDetectChanges(true)` — auto-run change detection (use sparingly)
- `fixture.destroy()` — trigger component destruction

### Angular testing — DebugElement

- `debugElement.query(predicate)` / `.queryAll(predicate)` — find child elements
- `By.css(selector)` / `By.directive(Directive)` / `By.all` — query predicates
- `debugElement.injector.get(Token)` — access element-level injector
- `debugElement.triggerEventHandler('click', eventObj)` — trigger template listeners
- `debugElement.nativeElement` — unwrap to native DOM element
- `debugElement.references` — template local variables (`#foo`)

### Angular testing — Routing & HTTP

- `provideRouter` + `RouterTestingHarness` (routed component testing)
- `RouterTestingHarness.create()`, `.navigateByUrl(url, Component)`, `.routeNativeElement`
- `provideHttpClient` + `provideHttpClientTesting` + `HttpTestingController`
- `NO_ERRORS_SCHEMA` (shallow testing — ignore unknown elements)

### Vitest

- `describe`, `it`, `expect`, `beforeEach`, `afterEach` — globals
- `vi.fn()`, `vi.spyOn()`, `vi.mocked()` — mocking utilities
- `Mocked<T>` — type utility for type-safe mock objects
- `mockReturnValue()`, `mockClear()` — control and reset mocks
- `vi.useFakeTimers()`, `await vi.runAllTimersAsync()`, `vi.useRealTimers()` — timer control

### NOT available with Vitest

- `fakeAsync`, `tick`, `flush` — these require zone.js and do NOT work with Vitest

---

## 10. Future Considerations

### Component Test Harnesses

Angular supports [component harnesses](https://angular.dev/guide/testing/component-harnesses-overview)
— classes that provide a stable, user-facing API for interacting with components
in tests. Benefits:

- Insulate tests from DOM structure / CSS class changes
- Same harness works in both unit and E2E tests
- Improve test readability for complex components

Consider creating harnesses for widely reused components (e.g. `elements/**`,
`oengus-common/**`) once the basic test suite is stable. This is NOT required
for the initial testing effort.

---

_End of plan. Execute step-by-step; keep the suite green after every file._
