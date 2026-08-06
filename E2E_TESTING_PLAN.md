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
npx playwright install --with-deps
```

This installs the Playwright test runner and downloads browser binaries
(Chromium, Firefox, WebKit).

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
    "types": ["node"],
    "paths": {
      "@mocks/*": ["./mocks/*"],
      "@fixtures/*": ["./fixtures/*"],
      "@pages/*": ["./pages/*"]
    }
  },
  "include": ["**/*.ts"]
}
```

### 2.5 Package.json scripts

Add these scripts:

```json
"e2e": "npx playwright test",
"e2e:ui": "npx playwright test --ui",
"e2e:headed": "npx playwright test --headed",
"e2e:report": "npx playwright show-report e2e/playwright-report"
```

### 2.6 .gitignore additions

```
e2e/test-results/
e2e/playwright-report/
e2e/.auth/
```

---

## 3. Global HTTP Mocking Architecture

All HTTP requests are mocked by default via a custom fixture. Individual tests
override only the routes they need to change.

Reference: https://playwright.dev/docs/mock

### 3.1 Design principles

1. **All API calls are mocked globally** — tests never hit a real backend.
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
  // Catch-all: any unhandled /api/** request returns 404
  await context.route('**/api/**', async (route) => {
    await route.fulfill({
      status: 404,
      json: { error: 'No mock registered for this endpoint' },
    });
  });

  // User: not logged in by default
  await context.route('**/api/v2/users/@me*', async (route) => {
    await route.fulfill({ status: 401, json: { error: 'Unauthorized' } });
  });

  // Marathon list (homepage)
  await context.route('**/api/v1/marathons*', async (route) => {
    await route.fulfill({
      json: [],
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
import { registerGlobalMocks } from '../mocks/handlers';

export const test = base.extend({
  // Auto-fixture: registers global mocks on every test's context
  mockApi: [async ({ context }, use) => {
    await registerGlobalMocks(context);
    await use();
  }, { auto: true }],
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

    // Override the /users/@me route to return a logged-in user
    await page.route('**/api/v2/users/@me', async (route) => {
      await route.fulfill({
        json: {
          id: payload.sub,
          username: payload.username,
          displayName: faker.person.fullName(),
          enabled: true,
          roles: ['ROLE_USER'],
          languagesSpoken: ['en'],
        },
      });
    });

    await use(page);
  },
});

export { expect } from './base';
```

### 3.5 Per-test mock override pattern

Tests override specific endpoints using `page.route()`. Because page-level
routes take precedence over context-level routes, the global mock is effectively
replaced for that one test:

```typescript
import { test, expect } from '../../fixtures/base';
import { faker } from '@faker-js/faker';

test('displays marathon details', async ({ page }) => {
  const marathonId = faker.string.alphanumeric(5);
  const marathonName = faker.company.name();

  // Override the specific marathon endpoint for this test
  await page.route(`**/api/v1/marathons/${marathonId}`, async (route) => {
    await route.fulfill({
      json: {
        id: marathonId,
        name: marathonName,
        startDate: '2026-09-01T12:00:00Z',
        endDate: '2026-09-03T12:00:00Z',
        submissionsOpen: true,
      },
    });
  });

  await page.goto(`/marathon/${marathonId}`);
  await expect(page.getByRole('heading', { name: marathonName })).toBeVisible();
});
```

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

Each step is independently mergeable. Keep the suite green after every step.

### Step 1 — Scaffold & hello world
- Install `@playwright/test`
- Create `e2e/playwright.config.ts`
- Create `e2e/tsconfig.json`
- Create `e2e/fixtures/base.ts` with global mocking fixture
- Create `e2e/mocks/handlers.ts` with minimal catch-all handler
- Write one smoke test (`homepage.spec.ts`) that verifies the app loads
- Add npm scripts (`e2e`, `e2e:ui`, `e2e:headed`, `e2e:report`)
- Add entries to `.gitignore`
- Verify: `npm run e2e` passes

### Step 2 — Authentication fixtures
- Create `e2e/fixtures/auth.ts`
- Create mock data factory for user responses (`e2e/mocks/data/user.ts`)
- Write tests: login page renders, authenticated user sees their username in header

### Step 3 — Homepage & marathon list
- Add global mock for marathon list endpoint
- Create `e2e/mocks/data/marathon.ts` factory
- Write tests: homepage displays marathon cards, empty state, upcoming/live filters

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
- Add Playwright to CI pipeline (GitHub Actions or equivalent)
- Configure single-browser (Chromium) for CI speed
- Upload test artifacts (traces, screenshots) on failure

---

## 7. Per-Step "Definition of Done"

- New specs pass under `npm run e2e` across all configured browsers.
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

### Service Workers
If this app registers a service worker, it may intercept routes before Playwright
can. Disable with:
```typescript
use: {
  serviceWorkers: 'block',
}
```
Reference: https://playwright.dev/docs/network

### Angular route handling
Angular's client-side router handles navigation after initial load. For tests
that navigate via clicks (not `page.goto()`), wait for the target URL:
```typescript
await page.getByRole('link', { name: 'Schedule' }).click();
await page.waitForURL('**/marathon/*/schedule');
```

### i18n in tests
Translations are embedded into the application bundle (not loaded via HTTP at
runtime), so no mocking of translation endpoints is needed. Tests can assert
against English text directly. For elements where translation keys vary by
locale, use `data-testid` attributes as a stable selector.

### Debugging
- `npx playwright test --debug` — step through tests with inspector
- `npx playwright test --ui` — visual UI mode with time-travel debugging
- `npx playwright show-report` — view HTML report after a run
- Traces (captured on retry) show every action, network call, and DOM snapshot

---

_End of plan. Execute step-by-step; keep the suite green after every file._
