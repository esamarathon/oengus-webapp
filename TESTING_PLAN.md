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

### 2.7 (Optional) zone.js support for fakeAsync

If specs need `fakeAsync`/`flush`/`waitForAsync`, add `zone.js/plugins/vitest-patch`
to polyfills in the test target. Long-term, prefer native async and Vitest fake
timers (`vi.useFakeTimers()`).

### 2.8 (Optional) Custom Vitest config

If needed later, add `runnerConfig` to angular.json options pointing to a
`vitest.config.ts`. The CLI will override `test.projects` and `test.include`
automatically.

### 2.9 Verify

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
- **No real HTTP / no real timers / no real router navigation.** Always mock.
- **Prefer `HttpTestingController`** (`provideHttpClientTesting`) for services.
- **Prefer `vi.fn()` mocks over full dependency instances** for components.
- **Isolate `localStorage`:** in `beforeEach`, `localStorage.clear()` or spy.
- **Deterministic dates:** inject/stub `TemporalServiceService`; never rely on real `now`.
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
      expect(parseMastodonUrl('@a@mastodon.social'))
        .toBe('https://mastodon.social/@a');
    });
    it('should handle empty input gracefully', () => {
      expect(parseMastodonUrl('')).toBe('');
    });
  });
});
```

### 5.2 Services WITHOUT HTTP (pure logic)

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService (pure logic)', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: NotificationService, useValue: { toastRaw: vi.fn() } },
      ],
    });
    service = TestBed.inject(AuthService);
    localStorage.clear();
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
    service.find('ABC').subscribe(m => (result = m));
    const req = http.expectOne(/\/v1\/marathons\/ABC/);
    expect(req.request.method).toBe('GET');
    req.flush({ startDate: '2026-01-01T00:00:00Z' });
    expect(result.startDate).toBeDefined();
  });
});
```

### 5.4 Components — standalone

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { TranslateTestingModule } from '../../../testing/translate-testing';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent, TranslateTestingModule],
      providers: [
        { provide: AuthService, useValue: { performLogin: vi.fn() } },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('lowercases username before login', () => {
    component.loginData.username = 'ADMIN';
    component.performLogin();
    expect(component.loginData.username).toBe('admin');
  });
});
```

### 5.5 Components with route data

```typescript
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

// In providers:
{ provide: ActivatedRoute, useValue: {
  snapshot: { data: { marathon: makeMarathon() }, paramMap: convertToParamMap({ id: 'ABC' }) },
  paramMap: of(convertToParamMap({ id: 'ABC' })),
} }
```

### 5.6 Pipes, Directives, Guards, Resolvers

Same patterns as before but using Vitest APIs (`vi.fn()` instead of
`jasmine.createSpyObj`, `expect(...).toBe(true)` instead of
`expect(...).toBeTrue()`).

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

---

## 7. Per-Step "Definition of Done"

- New specs pass under `npm run test:ci` (Vitest, `--watch=false`).
- No unhandled promise/observable warnings in test output.
- `http.verify()` in `afterEach` for every HTTP spec.
- Meaningful assertions (behavior), not just `expect(component).toBeTruthy()`.
- Coverage does not regress; trends upward toward §4 targets.

---

## 8. Mocking Cheat-Sheet (Vitest edition)

| Dependency | How to mock |
|---|---|
| `HttpClient` | `provideHttpClient()` + `provideHttpClientTesting()` + `HttpTestingController` |
| `Router` | `{ navigate: vi.fn(), navigateByUrl: vi.fn() }` |
| `ActivatedRoute` | Fake object with `snapshot`, `paramMap`, `parent` |
| `TranslateService` | `{ get: vi.fn(() => of(key)), instant: vi.fn(k => k) }` |
| `NotificationService` | `{ toast: vi.fn(), toastRaw: vi.fn() }` |
| `UserService` | Object with `user`, `token` props + `vi.fn()` methods |
| `MarathonService` | Object with `marathon` prop + `vi.fn()` methods returning `of(...)` |
| `TemporalServiceService` | `{ parseDate: vi.fn(), now: vi.fn(), timeZone: 'UTC' }` |
| `MarkdownService` | `{ renderInlineSimple: vi.fn(x => x), render: vi.fn(x => x) }` |
| `localStorage` | `localStorage.clear()` in `beforeEach`, or `vi.spyOn(Storage.prototype, 'getItem')` |

---

## 9. Reference: Key Vitest + Angular Testing APIs

- `TestBed.configureTestingModule` / `TestBed.inject` / `TestBed.createComponent`
- `TestBed.runInInjectionContext` (for `inject()`-based pipes/directives/resolvers)
- `ComponentFixture`, `fixture.detectChanges()`, `fixture.whenStable()`
- `fakeAsync`, `tick`, `flush` (from `@angular/core/testing` — still work with Vitest)
- `provideHttpClient` + `provideHttpClientTesting` + `HttpTestingController`
- `vi.fn()`, `vi.spyOn()`, `vi.mocked()` — Vitest mocking utilities
- `describe`, `it`, `expect`, `beforeEach`, `afterEach` — Vitest globals

---

_End of plan. Execute step-by-step; keep the suite green after every file._
