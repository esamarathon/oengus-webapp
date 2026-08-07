# Oengus Webapp — Playwright E2E Testing Plan

> Goal: Add end-to-end tests using **Playwright** to verify full user flows in
> this Angular 22 application. All HTTP requests are mocked globally via a custom
> fixture; individual tests can override specific routes as needed.
>
> **Important:** When unsure about any package, API, or configuration, consult the
> official documentation:
> - Playwright: https://playwright.dev/docs/intro
> - Angular E2E: https://angular.dev/tools/cli/end-to-end
>
> Do NOT rely on potentially outdated knowledge. Always verify against the source.

---

## 1. Current State

| Aspect | Finding |
|---|---|
| Angular version | 22.0.7 |
| Dev server | `ng serve` on `http://localhost:4200` |
| API proxy | `/api` → `http://localhost:8080` (rewritten, removing `/api` prefix) |
| API base (in-app) | `environment.api` (prod: `https://oengus.io/api`, local: proxied) |
| Auth | JWT stored in `localStorage` |
| i18n | `@ngx-translate/core` (JSON files in `src/assets/i18n/`) |
| Existing e2e tests | **None** (`e2e/` directory does not exist) |
| Test folder | `e2e/` (to be created at project root) |

---

## 2. Installation & Setup

### 2.1 Install Playwright

```bash
npm install --save-dev @playwright/test
npx playwright install --with-deps chromium firefox
```

This installs the Playwright test runner and downloads only the browser binaries
we actually use — **Chromium and Firefox**. WebKit is intentionally **not**
installed, since no project targets it (see §2.3).

Reference: https://playwright.dev/docs/intro#installing-playwright

### 2.2 Create directory structure

```
playwright.config.ts             # Playwright configuration (project root)
e2e/
├── fixtures/
│   ├── base.ts                  # Custom test fixture with global API mocking
│   └── auth.ts                  # Authenticated user fixture
├── mocks/
│   ├── handlers.ts              # Default mock route handlers (global)
│   ├── mock-api.ts              # Per-test MockApi helper (concise overrides)
│   ├── data/                    # Mock response data factories
│   │   ├── marathon.ts
│   │   ├── user.ts
│   │   ├── schedule.ts
│   │   └── ...
│   └── index.ts                 # Re-exports all handlers
├── pages/                       # Page Object Models
│   ├── marathon.page.ts
│   ├── login.page.ts
│   └── ...
├── homepage.spec.ts
├── auth/
│   ├── login.spec.ts
│   └── signup.spec.ts
├── marathon/
│   ├── view.spec.ts
│   ├── submit.spec.ts
│   └── schedule.spec.ts
├── user/
│   ├── profile.spec.ts
│   └── settings.spec.ts
└── tsconfig.json                # TypeScript config for e2e tests
```

### 2.3 Playwright configuration

Create `playwright.config.ts` at the **project root**:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: './e2e/playwright-report' }],
    ['list'],
  ],

  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Pin locale + timezone for determinism. The app localizes routes via
    // @oengusio/ngx-translate-router (default 'en-GB', alwaysSetPrefix: false),
    // so forcing en-GB keeps URLs unprefixed and text in English. UTC keeps
    // rendered dates/times (schedules, countdowns) stable across machines/CI.
    locale: 'en-GB',
    timezoneId: 'UTC',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

Key decisions:
- **`webServer`** launches `ng serve` automatically before tests and waits for
  it to be ready. In CI this always starts fresh; locally it reuses a running
  server.
- **`fullyParallel: true`** runs tests concurrently for speed.
- **`retries: 2`** in CI catches flaky tests; traces are captured on first retry.
- **Two browser projects** (Chromium + Firefox) ensure cross-browser compatibility.

Reference: https://playwright.dev/docs/test-configuration

### 2.4 TypeScript configuration

Create `e2e/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["**/*.ts"]
}
```

> **No path aliases.** We deliberately omit a `paths` block and use relative
> imports (e.g. `import { test } from '../fixtures/base'`). TypeScript `paths`
> only affect *type-checking* — they don't rewrite the emitted JS, and
> Playwright's runtime does not read tsconfig `paths` without an extra resolver,
> so aliases would resolve in the editor but fail at runtime. (`baseUrl` isn't
> required for `paths` since TS 4.1 and is discouraged outside AMD loaders
> anyway.)

### 2.5 Package.json scripts

Add these scripts:

```json
"e2e": "npx playwright test",
"e2e:ui": "npx playwright test --ui",
"e2e:headed": "npx playwright test --headed",
"e2e:report": "npx playwright show-report e2e/playwright-report"
```

> **Note:** `package.json` already defines `"e2e": "ng e2e"`. This intentionally
> **replaces** it — the project is standardizing on Playwright, and the Angular
> `ng e2e` builder is not used.

### 2.6 .gitignore additions

```
e2e/test-results/
e2e/playwright-report/
e2e/.auth/
```

### 2.7 ESLint and e2e (intentionally not linted)

`eslint.config.js` already ignores `**/e2e/**` and only lints `src/**`. **Keep it
that way on purpose** — the e2e tests are deliberately excluded from linting,
which avoids extra config (Playwright/TypeScript ESLint rules, separate tsconfig
wiring) and day-to-day lint churn. **No ESLint changes are required** for e2e, and
`npm run lint` (the CI `lint_code` gate) continues to cover only `src/**`.

Trade-off: issues ESLint would normally catch in test code (e.g. a missing
`await` on an assertion) won't be flagged by the linter — rely on code review and
the e2e run itself to catch them.

---

## 3. Global HTTP Mocking Architecture

All HTTP requests are mocked by default via a custom fixture. Individual tests
override only the routes they need to change.

Reference: https://playwright.dev/docs/mock

### 3.1 Design principles

1. **All API calls are mocked globally** — tests never hit a real backend. The
   e2e container runs without internet access, so any un-mocked `/api/**` request
   throws and fails the test (see the catch-all in §3.2) rather than silently
   returning an error response.
2. **Global mocks use `context.route()`** — applies to all pages in the test
   context, including popups and navigated links.
3. **Per-test overrides use `page.route()`** — page-level routes take precedence
   over context-level routes for the same URL pattern.
4. **`route.fallback()`** enables composable handler chains — later-registered
   handlers run first and can defer to earlier handlers.
5. **Mock data uses `@faker-js/faker`** — consistent with unit tests; never
   static/hardcoded data.

### 3.2 Global mock handlers (`e2e/mocks/handlers.ts`)

```typescript
import { BrowserContext } from '@playwright/test';
import { faker } from '@faker-js/faker';

/**
 * Registers default API route handlers on the given browser context.
 * Every API call is intercepted and returns a sensible default response.
 * Tests that need different data override specific routes via page.route().
 */
export async function registerGlobalMocks(context: BrowserContext): Promise<void> {
  // Catch-all: any unhandled /api/** request is a test bug. The e2e container
  // has no internet access, so an un-mocked API call can never succeed — fail
  // loudly instead of silently returning a 404 that hides the missing mock.
  // Registered FIRST so specific handlers (registered later) take precedence.
  await context.route('**/api/**', async (route) => {
    throw new Error(
      `Un-mocked API call: ${route.request().method()} ${route.request().url()}`,
    );
  });

  // User: not logged in by default.
  // NOTE: match @me EXACTLY (no trailing `*`) — a greedy `@me*` glob would also
  // capture sub-resources like `/api/v2/users/@me/saved-games` and wrongly 401 them.
  await context.route('**/api/v2/users/@me', async (route) => {
    await route.fulfill({ status: 401, json: { error: 'Unauthorized' } });
  });

  // Homepage metadata (the homepage does NOT call /api/v1/marathons — it calls
  // the v2 "for-home" endpoint, which returns server-bucketed marathon arrays).
  // Shape must match HomepageMetaDataRaw: { next, open, live }.
  await context.route('**/api/v2/marathons/for-home', async (route) => {
    await route.fulfill({
      json: { next: [], open: [], live: [] },
    });
  });

  // Languages
  await context.route('**/api/v1/languages*', async (route) => {
    await route.fulfill({
      json: [
        { text: 'English', value: 'en' },
        { text: 'French', value: 'fr' },
      ],
    });
  });

  // Add more default handlers as tests are written...
}
```

### 3.3 Custom base fixture (`e2e/fixtures/base.ts`)

```typescript
import { test as base, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { registerGlobalMocks } from '../mocks/handlers';
import { MockApi } from '../mocks/mock-api';

export const test = base.extend<{ mockApi: MockApi; globalMocks: void }>({
  // Auto-fixture: seed faker + register global mocks on every test's context
  globalMocks: [async ({ context }, use) => {
    // Seed faker per-test for reproducibility. Random-but-deterministic data
    // means a failing run can be reproduced exactly (check the seed in the
    // report), instead of flaking on values that change every run.
    faker.seed(20260807);
    await registerGlobalMocks(context);
    await use();
  }, { auto: true }],

  // Per-test helper for concise response overrides (see §3.5). Injected into
  // every test as `mockApi`.
  mockApi: async ({ page }, use) => {
    await use(new MockApi(page));
  },
});

export { expect };
```

Every test file imports from this fixture instead of `@playwright/test`:

```typescript
import { test, expect } from '../fixtures/base';
```

### 3.4 Authenticated fixture (`e2e/fixtures/auth.ts`)

```typescript
import { test as base } from './base';
import { faker } from '@faker-js/faker';

export const test = base.extend({
  // Override the page fixture to inject a JWT into localStorage
  page: async ({ page, context }, use) => {
    // Create a fake JWT payload
    const payload = {
      sub: faker.number.int({ min: 1, max: 9999 }),
      username: faker.internet.username(),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const fakeToken = `header.${btoa(JSON.stringify(payload))}.signature`;

    // Set localStorage before navigating
    await context.addInitScript((token) => {
      window.localStorage.setItem('token', token);
    }, fakeToken);

    // Override the /users/@me route to return a logged-in user.
    // IMPORTANT (verified against AppComponent + UserService.me()):
    //  - `email` MUST be present and non-empty, otherwise the app redirects to
    //    `/user/new` on load.
    //  - `enabled` MUST be true, otherwise the app logs the user out and toasts
    //    "disabled account".
    await page.route('**/api/v2/users/@me', async (route) => {
      await route.fulfill({
        json: {
          id: payload.sub,
          username: payload.username,
          displayName: faker.person.fullName(),
          email: faker.internet.email(),
          enabled: true,
          roles: ['ROLE_USER'],
          languagesSpoken: ['en'],
        },
      });
    });

    await use(page);
```

**Verified auth bootstrap** (so this fixture actually logs the user in):
`AppComponent`'s constructor runs `if (!userService.user && userService.token)
{ userService.me(); }`. `token` is read from `localStorage` (key `token`), and
`me()` issues `GET /api/v2/users/@me`. Crucially, the token's `exp` is **not**
validated at bootstrap, so the fake token only needs to *exist* — setting
`localStorage.token` + mocking `@me` is sufficient. (`exp` is still set to a
future time for any code path that decodes it later.)
});

export { expect } from './base';
```

### 3.5 Per-test mock overrides — the `mockApi` helper

Raw `page.route(...)` + `route.fulfill(...)` is verbose. The `mockApi` fixture
(injected into every test) wraps it so a test declares a response in one line.

`e2e/mocks/mock-api.ts`:

```typescript
import { Page, Route } from '@playwright/test';

export interface MockResponse {
  status?: number;                 // defaults to 200
  json?: unknown;
  body?: string;
  headers?: Record<string, string>;
}

type Responder = MockResponse | ((route: Route) => MockResponse | Promise<MockResponse>);

export class MockApi {
  constructor(private readonly page: Page) {}

  /** Any HTTP method. `path` may be a full glob or a short API path like '/v2/...'. */
  on(path: string, responder: Responder): Promise<void> {
    return this.register(undefined, path, responder);
  }

  get(path: string, responder: Responder) { return this.register('GET', path, responder); }
  post(path: string, responder: Responder) { return this.register('POST', path, responder); }
  put(path: string, responder: Responder) { return this.register('PUT', path, responder); }
  patch(path: string, responder: Responder) { return this.register('PATCH', path, responder); }
  delete(path: string, responder: Responder) { return this.register('DELETE', path, responder); }

  private async register(method: string | undefined, path: string, responder: Responder) {
    await this.page.route(toGlob(path), async (route) => {
      if (method && route.request().method() !== method) {
        return route.fallback();   // wrong verb → let other handlers try
      }
      const res = typeof responder === 'function' ? await responder(route) : responder;
      await route.fulfill({
        status: res.status ?? 200,
        json: res.json,
        body: res.body,
        headers: res.headers,
      });
    });
  }
}

// Accepts a full Playwright glob (already starting with '**'), or expands a
// short API path like '/v2/marathons' into a full '/api/...' glob.
function toGlob(path: string): string {
  if (path.startsWith('**')) return path;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `**/api${p}`;
}
```

Usage — one line per endpoint:

```typescript
import { test, expect } from '../../fixtures/base';
import { faker } from '@faker-js/faker';

test('displays marathon details', async ({ page, mockApi }) => {
  const id = faker.string.alphanumeric(5);
  const name = faker.company.name();

  await mockApi.get(`/v1/marathons/${id}`, {
    json: {
      id, name,
      startDate: '2026-09-01T12:00:00Z',
      endDate: '2026-09-03T12:00:00Z',
      submissionsOpen: true,
    },
  });

  await page.goto(`/marathon/${id}`);
  await expect(page.getByRole('heading', { name })).toBeVisible();
});
```

Error and request-derived responses stay just as terse:

```typescript
// Error state
await mockApi.get('/v2/marathons/for-home', { status: 500, json: { error: 'boom' } });

// Response derived from the request
await mockApi.post('/v2/marathons', () => ({
  status: 201,
  json: { id: faker.string.alphanumeric(5) },
}));
```

Non-GET verbs (`post`, `put`, `patch`, `delete`) work identically. Method
matching is enforced — a request whose verb doesn't match calls `route.fallback()`,
so it won't accidentally match and instead falls through to other handlers (or
the hard-fail catch-all):

```typescript
// POST — return a created resource (201)
await mockApi.post('/v2/marathons', { status: 201, json: { id: 'abc123' } });

// DELETE — return 204 No Content
await mockApi.delete(`/v1/marathons/${id}`, { status: 204 });

// One endpoint, multiple verbs — register each; they're method-scoped and coexist
await mockApi.get(`/v1/marathons/${id}`, { json: { id, name } });
await mockApi.delete(`/v1/marathons/${id}`, { status: 204 });
```

To **assert a write actually happened** (with the expected body), pair the mock
with `waitForRequest`:

```typescript
const created = page.waitForRequest(
  (r) => r.url().includes('/api/v2/marathons') && r.method() === 'POST',
);

await mockApi.post('/v2/marathons', { status: 201, json: { id: 'abc123' } });

// ... trigger the UI action that submits the form ...

const req = await created;
expect(req.postDataJSON()).toMatchObject({ name: 'My Marathon' });
```

Because these register `page.route` handlers, they take precedence over the
context-level global mocks (see §3.6), and the latest registration wins — so a
test can freely override a default.

Reference: https://playwright.dev/docs/mock#mock-api-requests

### 3.6 Mocking order of precedence

From highest to lowest priority:
1. `page.route()` — registered in the individual test
2. `page.route()` — registered in `beforeEach` of the test file
3. `context.route()` — registered in the custom fixture (global mocks)

Within the same scope, routes registered **later** take precedence (reverse
registration order). Use `route.fallback()` if you need to compose multiple
handlers for the same pattern.

Reference: https://playwright.dev/docs/api/class-route#route-fallback

---

## 4. Page Object Model

Page Objects encapsulate page-specific selectors and actions, keeping tests
readable and resilient to DOM changes.

Reference: https://playwright.dev/docs/best-practices

### 4.1 Example: Marathon Page

```typescript
import { Page, Locator } from '@playwright/test';

export class MarathonPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly submitButton: Locator;
  readonly scheduleTab: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1 });
    this.submitButton = page.getByRole('link', { name: /submit/i });
    this.scheduleTab = page.getByRole('link', { name: /schedule/i });
  }

  async goto(marathonId: string) {
    await this.page.goto(`/marathon/${marathonId}`);
  }

  async goToSchedule() {
    await this.scheduleTab.click();
  }
}
```

### 4.2 Using Page Objects in tests

```typescript
import { test, expect } from '../../fixtures/base';
import { MarathonPage } from '../../pages/marathon.page';

test('can navigate to schedule tab', async ({ page }) => {
  // ... set up mock for marathon data ...
  const marathon = new MarathonPage(page);
  await marathon.goto('abc123');
  await marathon.goToSchedule();
  await expect(page).toHaveURL(/\/marathon\/abc123\/schedule/);
});
```

### 4.3 Locator best practices

Prefer user-facing locators (what users see/interact with):
- `page.getByRole('button', { name: 'Submit' })` — ARIA role + accessible name
- `page.getByLabel('Username')` — form labels
- `page.getByText('Welcome')` — visible text
- `page.getByTestId('marathon-card')` — `data-testid` attributes (last resort)

Avoid:
- CSS class selectors (`.btn-primary`) — break when styles change
- XPath — fragile, hard to read
- Deep DOM structure selectors (`div > ul > li:nth-child(2)`)

Reference: https://playwright.dev/docs/best-practices#use-locators

---

## 5. Conventions

### 5.1 File naming
- Test files: `*.spec.ts` inside `e2e/tests/`
- Page objects: `*.page.ts` inside `e2e/pages/`
- Mock data factories: named by domain (`marathon.ts`, `user.ts`) inside `e2e/mocks/data/`

### 5.2 Test structure
- Use `test.describe()` to group related scenarios
- One assertion concept per test (but soft assertions are fine for related checks)
- Tests should be independent — no shared mutable state between tests
- Each test sets up only the mock overrides it needs; relies on global defaults
  for everything else

### 5.3 Assertions
- Use web-first assertions (`await expect(locator).toBeVisible()`) — they
  auto-retry until the condition is met or timeout expires
- Never use `expect(await locator.isVisible()).toBe(true)` — this does not retry

Reference: https://playwright.dev/docs/best-practices#use-web-first-assertions

### 5.4 Mock data
- Use `@faker-js/faker` for all generated data (same as unit tests)
- Faker is **seeded** in the base fixture (§3.3) so data is random but
  deterministic — reproducible failures, no flaky assertions on changing values
- Mock response shapes must match the actual API contracts
- Factor reusable response builders into `e2e/mocks/data/`

### 5.5 Authentication
- Unauthenticated tests: import from `e2e/fixtures/base.ts`
- Authenticated tests: import from `e2e/fixtures/auth.ts`
- Admin tests: create an `e2e/fixtures/admin.ts` extending `auth.ts` with admin
  roles

### 5.6 No third-party dependencies tested
- All external APIs (Patreon, Twitch OAuth, Discord OAuth, PayPal) are mocked
- Never test OAuth login flows against real providers
- Focus on testing **your** application logic, not third-party services

Reference: https://playwright.dev/docs/best-practices#avoid-testing-third-party-dependencies

---

## 6. Execution Order — Small Steps

Each step is independently mergeable. Keep the suite green after every step —
"green" means **`npm run lint`, `npm run test:ci`, and `npm run e2e` all pass**
(these are the checks the CI `lint_code` job runs). Note `npm run lint` does not
cover the `e2e/` files by design (see §2.7), so it won't fail on test code.

### Step 0 — Selector audit (prerequisite)
The example locators throughout this plan (e.g. `getByRole('heading', { name })`,
`getByRole('link', { name: /submit/i })`) are **illustrative, not verified**. The
app currently has **no `data-testid` attributes**, and its Bulma-based markup does
not always expose accessible roles/names. Before writing assertions:
- Audit the screens each step touches (homepage, marathon detail, schedule,
  submission form, profile/settings).
- Prefer fixing/adding real ARIA roles and accessible names where cheap.
- Where a user-facing locator isn't practical, add a stable `data-testid` to the
  template as part of the same change.
- Treat the example selectors in this document as starting points to be replaced
  with verified ones.

### Step 1 — Scaffold & hello world
- Install `@playwright/test`
- Create `playwright.config.ts` at the **project root** (matches `testDir: './e2e'`)
- Create `e2e/tsconfig.json`
- Create `e2e/fixtures/base.ts` with global mocking fixture
- Create `e2e/mocks/handlers.ts` with minimal catch-all handler
- Write one smoke test (`homepage.spec.ts`) that verifies the app loads
- Add npm scripts (`e2e`, `e2e:ui`, `e2e:headed`, `e2e:report`) — note this
  replaces the existing `"e2e": "ng e2e"` script (intentional; see §2.5)
- Add entries to `.gitignore`
- Verify: `npm run e2e` passes

### Step 2 — Authentication fixtures
- Create `e2e/fixtures/auth.ts`
- Create mock data factory for user responses (`e2e/mocks/data/user.ts`)
- Write tests: login page renders, authenticated user sees their username in header

### Step 3 — Homepage & marathon list
- Add global mock for the homepage metadata endpoint
  (`GET /api/v2/marathons/for-home`, returns `{ next, open, live }` arrays)
- Create `e2e/mocks/data/marathon.ts` factory (builds `MarathonRaw` objects)
- Write tests: homepage displays marathon cards for each bucket (next/open/live),
  empty state when all buckets are empty. Note: bucketing is decided by the
  server response, not by client-side time, so no clock control is needed here.

### Step 4 — Marathon detail page
- Create `MarathonPage` page object
- Mock marathon detail, submissions, schedule endpoints
- Write tests: marathon heading, date display, navigation between tabs

### Step 5 — Submission flow (authenticated)
- Mock game search, submission creation endpoints
- Write tests: user can submit a game, validation errors display, category selection

### Step 6 — Schedule view
- Mock schedule data endpoint
- Write tests: schedule table renders runs, time display, runner links

### Step 7 — User profile & settings
- Mock user profile, settings endpoints
- Write tests: profile displays user info, settings can be changed

### Step 8 — Error states & edge cases
- Test 404 page (unknown route)
- Test API error responses (500, 403)
- Test network timeout handling
- Test empty states (no submissions, no schedule)

### Step 9 — CI integration
Extend the existing workflow `.github/workflows/build-image.yml`. Its `lint_code`
job already runs `checkout → setup node (22.x) → npm install → npm run lint →
npm run test:ci`. Add the e2e steps to that job, after the `run unit tests` step:

```yaml
      - name: Install Playwright browsers
        run: npx playwright install chromium --with-deps

      - name: Run e2e tests
        run: npx playwright test --project=chromium

      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: e2e/playwright-report/
          retention-days: 14
```

Notes:
- Only Chromium runs in CI (one browser keeps the run short); Firefox runs locally.
- `--with-deps` installs OS-level dependencies (libs needed by Chromium on Ubuntu).
- The report artifact uploads on failure **or** success (`!cancelled()`) so
  results are always inspectable.
- The existing `Install deps` step (`npm install`) already installs
  `@playwright/test` once it's added to devDependencies in Step 1.
- The Playwright `webServer` config starts `npm run dev` automatically, so no
  separate "start server" step is required. Because all API calls are mocked and
  the runner has no internet access, no backend is needed.

---

### Future coverage (backlog)
Steps 1–9 cover the core visitor + basic authenticated flows. The following
larger surfaces are intentionally out of the initial scope and should be planned
as later phases (each likely needs its own mocks, and some need admin/mod
fixtures or feature-flag builds):
- **Admin / organizer:** marathon creation & editing, settings, moderator
  management, moderation actions.
- **Schedule editing:** the `vis-timeline` editor incl. drag/drop (gated behind
  `newScheduleEditTable`; needs the flag enabled in the build).
- **Auth extras:** MFA login, password reset request/confirm, email
  verification, expired-token → redirect behavior.
- **Donations & incentives:** donation flow (PayPal mocked), incentives, bids
  (gated by `donationsDisabled`).
- **User:** availability, saved games, profile history, language switching.

---

## 7. Per-Step "Definition of Done"

- New specs pass under `npm run e2e` across all configured browsers.
- `npm run lint` and `npm run test:ci` still pass (the `e2e/` folder is not
  linted by design — see §2.7 — so it won't affect lint).
- No flaky tests (retries should not be needed locally).
- All API calls are mocked — no real backend required.
- Page objects used for any page accessed in more than one test file.
- Mock data uses `@faker-js/faker` — no hardcoded static values.
- Tests are independent — can run in any order.

---

## 8. Reference: Key Playwright APIs

### Test runner

| API | Purpose |
|---|---|
| `test(name, fn)` | Define a test |
| `test.describe(name, fn)` | Group tests |
| `test.beforeEach(fn)` | Run before each test |
| `test.afterEach(fn)` | Run after each test |
| `test.use(options)` | Override config for a file/describe block |
| `test.extend(fixtures)` | Create custom test object with fixtures |
| `expect(locator)` | Web-first assertion (auto-retries) |
| `expect.soft(locator)` | Non-fatal assertion (continues test) |

### Page interaction

| API | Purpose |
|---|---|
| `page.goto(url)` | Navigate (relative to `baseURL`) |
| `page.getByRole(role, options)` | Find by ARIA role |
| `page.getByLabel(text)` | Find by associated label |
| `page.getByText(text)` | Find by text content |
| `page.getByTestId(id)` | Find by `data-testid` attribute |
| `page.locator(selector)` | CSS/XPath selector (last resort) |
| `locator.click()` | Click element |
| `locator.fill(value)` | Fill input |
| `locator.selectOption(value)` | Select dropdown option |

### Network mocking

| API | Purpose |
|---|---|
| `context.route(pattern, handler)` | Mock at context level (global) |
| `page.route(pattern, handler)` | Mock at page level (per-test override) |
| `route.fulfill(options)` | Return mock response |
| `route.abort()` | Block the request |
| `route.continue(options)` | Forward with modifications |
| `route.fallback(options)` | Defer to next matching handler |
| `route.fetch(options)` | Perform real request (for modification) |

### Assertions (web-first, auto-retrying)

| Assertion | Purpose |
|---|---|
| `toBeVisible()` | Element is visible |
| `toBeHidden()` | Element is hidden |
| `toHaveText(text)` | Element has exact text |
| `toContainText(text)` | Element contains text |
| `toHaveURL(url)` | Page URL matches |
| `toHaveTitle(title)` | Page title matches |
| `toHaveValue(value)` | Input has value |
| `toBeEnabled()` / `toBeDisabled()` | Element state |
| `toHaveCount(n)` | Number of matching elements |

### Configuration

| Option | Purpose |
|---|---|
| `baseURL` | Prefix for relative navigations |
| `webServer` | Auto-start dev server before tests |
| `projects` | Multi-browser configuration |
| `retries` | Retry failed tests N times |
| `trace` | When to capture execution traces |
| `screenshot` | When to capture screenshots |

---

## 9. Gotchas & Tips

### Time-dependent UI (freeze the clock)
`timezoneId: 'UTC'` (§2.3) stabilizes *how* dates render, but some UI depends on
the current *instant* — countdowns / "time until" displays and the `vis-timeline`
schedule are computed relative to `now` (via the app's temporal service). For
those tests, freeze the clock so the output is deterministic:
```typescript
await page.clock.install({ time: new Date('2026-09-01T12:00:00Z') });
await page.goto('/marathon/abc123/schedule');
```
Note: the **homepage** does not need this — its next/open/live bucketing is
decided by the server response, which you mock directly.

Reference: https://playwright.dev/docs/clock

### Feature flags
Some behavior is gated by compile-time flags in `environment.ts` (the config
`ng serve` uses). At time of writing: `donationsDisabled: false` and
`newScheduleEditTable: false`. E2E tests run against these **compiled** values —
they cannot be toggled at runtime via mocking. Write tests for the current flag
state, and if you need to cover the opposite state, add a dedicated
`environment.e2e.ts` (wired to an e2e build configuration) or temporarily flip the
flag in a separate run. Don't write tests that assume a flag value the build
doesn't actually produce.

### Angular route handling & localized routes
Angular's client-side router handles navigation after initial load. **Routes are
localized** via `@oengusio/ngx-translate-router` (`LocalizeRouterModule`), configured
with `defaultLangFunction: () => 'en-GB'` and `alwaysSetPrefix: false`. This means:
- The **default** language (`en-GB`) is served **without** a URL prefix
  (`/marathon/abc123`).
- A **non-default** locale prefixes the path (e.g. `/fr/marathon/abc123`), which
  would break URL assertions and change on-screen text.

Because the active language is resolved from the browser locale / cached value,
tests must pin it. The `locale: 'en-GB'` set in `playwright.config.ts` (§2.3)
keeps URLs unprefixed and text English. If a test still picks up a cached
language, also seed the cache before navigation:
```typescript
await context.addInitScript(() => {
  window.localStorage.setItem('language', 'en-GB'); // LocalizeRouter cacheName
});
```

For tests that navigate via clicks (not `page.goto()`), wait for the target URL:
```typescript
await page.getByRole('link', { name: 'Schedule' }).click();
await page.waitForURL('**/marathon/*/schedule');
```

### i18n in tests
Translations are **not** served from an API endpoint. `WebpackTranslateLoader`
resolves each language via a dynamic `import('../assets/i18n/${lang}.json')`,
which Angular bundles as a lazy-loaded JS chunk fetched over HTTP (same-origin,
not `/api`) on demand. So there is no translation *API* to mock — but the chunk
request is same-origin and served by the dev server, so it works offline in the
container. The default/fallback language is `en-GB` (special-cased to `en.json`),
so with the locale pinned (see above) tests can assert against English text
directly. For elements where translated text is awkward to assert on, add a
`data-testid` attribute as a stable selector.

### Debugging
- `npx playwright test --debug` — step through tests with inspector
- `npx playwright test --ui` — visual UI mode with time-travel debugging
- `npx playwright show-report` — view HTML report after a run
- Traces (captured on retry) show every action, network call, and DOM snapshot

---

_End of plan. Execute step-by-step; keep the suite green after every file._
