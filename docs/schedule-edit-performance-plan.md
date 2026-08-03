# Schedule Management — "Edit" Table Performance Investigation & Fix Plan

Scope investigated: `src/app/marathon/schedule-management/edit/**`
Symptom: On marathons with a **large schedule**, clicking the **Edit** (expand) button in
the schedule table is slow (several seconds), and typing anywhere on the page (especially the
runner autocomplete / inputs) causes noticeable lag.

---

## 1. Root cause summary

The table renders one row per schedule line and, for each row, evaluates several **expensive
expressions directly inside template bindings** (method calls and getters). None of the involved
components use `OnPush` change detection. Because the app runs on **zone.js + default change
detection**, *every* asynchronous event on the page — including **every keystroke** — triggers a
full change-detection pass that re-executes all of those expensive expressions for **every row**.

For a large schedule this becomes O(lines × runners × availabilities) of heavy work
(Markdown rendering + `Temporal` parsing) on every keystroke and every expand click, which is
what produces the multi-second stalls and typing lag.

### The expensive per-row work executed on every CD cycle

Location: `schedule-table-old-element.component.html`

1. **Markdown re-rendered every cycle** (`app-simple-md`)
   - `simple-md.component.ts` exposes `get markdownText()` which calls
     `markdown.renderInlineSimple(this.data)` on **every** change detection.
   - Used for **`line.game`** and **`line.category`** on every row (2× per line) plus the
     setup-block text. `markdown-it` is comparatively expensive; running it thousands of times
     per keystroke dominates the cost.

2. **Temporal parsing/formatting every cycle** (`app-element-temporal-datetime`,
   `app-element-temporal-duration`)
   - `element-temporal-datetime.component.ts` has `get date()` → `temporal.parseDate(...)`, and
     the template calls `temporal.format.format(date, format)` on every CD.
   - Rendered ~2× (time + day header) per line, plus 2× duration (estimate + setup).

3. **Availability checks as template method calls**
   - `[class]="{ 'is-warning': !matchesAvailabilities(line) }"` and
     `[class]="{ 'has-text-warning': !isAvailable(line, runner) }"`.
   - `matchesAvailabilities()` iterates all runners; `isAvailable()` parses `Temporal` dates for
     **every availability of every runner** via `temporalService.parseDate(...)` — all executed
     on every CD cycle, for every row and every runner.

4. **`shouldShowDay(i)` / `getRowParity(i)`** are also method calls in bindings (cheaper, but
   still run every cycle for every row).

### Why typing lags specifically

- The runner search input (`normal-run-editor.component.html`, `<ng-autocomplete (inputChanged)>`)
  fires on **every keystroke**. Each keystroke = a zone.js task = a full CD pass over the whole
  page, which re-runs all the per-row work above across the entire (large) table.
- Note: the game/category/console inputs already use `[ngModelOptions]="{ updateOn: 'blur' }"`,
  which limits *model* updates, but does **not** stop change detection from firing on keydown/keyup
  events, so the heavy bindings still re-run while typing.

### Why clicking "Edit" takes seconds

- `toggleExpand()` does `this.expanded = new Set(this.expanded)` (reassign to trigger CD) and
  causes the row's detail to render `app-normal-run-editor`. That instantiation itself is fine,
  but the accompanying change-detection pass re-evaluates every expensive binding for the whole
  table (see above). On a large schedule that single pass is what takes seconds.

### Secondary contributors

- **`changeDetection: ChangeDetectionStrategy.Eager`** is set on these components (and ~20 others).
  `Eager` **is** a valid Angular 22 change-detection strategy — confirmed by a clean
  `ng build` (no TS errors) against `@angular/core@22.0.7`. However, at runtime Angular reduces the
  strategy to a single boolean on `ComponentDef`:
  `readonly onPush: boolean; /** Whether or not this component's ChangeDetectionStrategy is OnPush */`
  (see `node_modules/@angular/core/types/_debug_node-chunk.d.ts`). Because `Eager !== OnPush`, these
  components get `onPush: false`, i.e. they are **dirty-checked on every change-detection tick** —
  the same eager behavior as the legacy `Default`. Nothing shields the heavy table from unrelated
  events (e.g. keystrokes). The fix is to switch the hot components to **`OnPush`**.
- **`@for (line of lines; track line)`** tracks by object identity. `computeSchedule()` mutates
  the existing line objects (good, identity preserved), but any flow that replaces the `lines`
  array (e.g. after `submit()` sets `this.lines = newLines`) forces a full re-create of every row.
- `scheduleDrop()` logs `console.log({ ...event })` on every drag drop (minor).

---

## 2. Fix plan (ordered by impact / effort)

The goal is to stop re-computing expensive values on every change-detection cycle. Two
complementary approaches: (A) memoize/cache the expensive computations, and (B) reduce how often
change detection runs and how much it touches.

### Step 1 — Convert expensive getters to pure pipes or cached values (highest impact)

- **`simple-md`**: Replace the `get markdownText()` getter with either
  - a **pure pipe** (`| simpleMd`) so Angular only re-renders when `data` changes, **or**
  - compute the rendered HTML in `ngOnChanges`/setter and store it in a field.
  - Mark the component `ChangeDetectionStrategy.OnPush`.
- **`element-temporal-datetime`** and **`element-temporal-duration`**: compute the formatted string
  in a setter / `ngOnChanges` (inputs: `dateTime`/`duration`/`format`) and bind to a plain field,
  instead of `get date()` + `format.format(...)` in the template. Mark them `OnPush`.
  - Locale changes (`changeLocale`) currently rely on CD to re-run the getter; if switching to
    cached values, recompute on a locale-change signal/observable or accept that locale changes
    require re-navigation. (Verify with `TemporalServiceService.changeLocale` usage.)

### Step 2 — Precompute availability state instead of template method calls

- Remove `matchesAvailabilities(line)` / `isAvailable(line, runner)` calls from template bindings.
- Precompute an availability map/flags whenever the relevant inputs change:
  - when `lines` change (add/remove/reorder), when `computeSchedule()` recomputes dates, and when
    `availabilities` (`allAvailabilities`) is updated (`loadAvailabilitiesForRunner`).
- Store results on the line/row view-model (e.g. `line.__available: boolean`, or a parallel
  `Map<lineId, boolean>`) and bind to those precomputed values.
- Optionally memoize `temporalService.parseDate` results for availability `from`/`to` strings,
  since the same availability strings are parsed repeatedly.

### Step 3 — Adopt `OnPush` on the table + editor components

- Set `ChangeDetectionStrategy.OnPush` (replacing `Eager`) on:
  - `schedule-table-old-element.component.ts`
  - `normal-run-editor.component.ts`, `setup-block-editor.component.ts`
  - the per-cell element components (`simple-md`, `element-temporal-datetime`,
    `element-temporal-duration`, `element-table-cell`, `element-table-detail`).
- With `OnPush`, keystrokes in unrelated inputs no longer force the big table to re-check.
- Ensure mutations that must reflect in the UI trigger CD correctly:
  - Continue the existing `expanded = new Set(expanded)` reassignment pattern (already OnPush-safe).
  - After mutating `lines` in place (`computeSchedule`, drag-drop, add/remove), either reassign
    `this.lines = [...this.lines]` or call `ChangeDetectorRef.markForCheck()`.
- Audit the whole project's `ChangeDetectionStrategy.Eager` usage (20+ files) and standardize on a
  valid strategy; confirm whether it was intended to be `OnPush`. Note: `Eager` is valid and
  compiles, but behaves as "check on every tick" (`onPush: false`), so it does **not** provide any
  performance isolation — only `OnPush` does.

### Step 4 — Improve `@for` tracking

- Give schedule lines a stable identity for tracking. Since `id` is `-1` for new/custom lines,
  introduce a stable client-side key (e.g. a generated `_key`/uuid assigned when the line is
  created/loaded) and use `track line._key`.
- This prevents unnecessary DOM re-creation when the `lines` array is replaced (e.g. after save).

### Step 5 — Reduce change-detection frequency from typing (optional but effective)

- The autocomplete already debounces the network call via `minQueryLength`, but consider:
  - Running the runner-search subscription / heavy handlers outside Angular
    (`NgZone.runOutsideAngular`) and re-entering only when results are ready, **or**
  - Moving toward a **zoneless** setup (Angular 22 supports `provideZonelessChangeDetection()`),
    which — combined with `OnPush` + signals — eliminates keystroke-triggered global CD entirely.
    This is a larger change; treat as a follow-up.

### Step 6 — Minor cleanups

- Remove `console.log({ ...event })` in `scheduleDrop()` and `console.log(...)` in
  `edit.component.ts` `initTimeline()`.
- The `estimateChangedDebounce` (lodash `debounce`, 500ms) is fine; keep it.

---

## 3. Suggested implementation order for the executing LLM

1. **Step 1** (memoize `simple-md` + temporal element components, add `OnPush`) — biggest win,
   low risk. Verify rendering + locale switching still work.
2. **Step 2** (precompute availability flags) — removes the remaining per-cycle `Temporal` work.
3. **Step 3** (`OnPush` on table + editor, replace `Eager`) — stops keystrokes from re-checking
   the table. Add `markForCheck()` / array reassignment where in-place mutations occur.
4. **Step 4** (stable `track` key).
5. **Step 5/6** (zoneless / cleanup) — optional follow-ups.

## 4. How to verify the fix

### Pre-implementation baseline (captured 2026-08-03)

- `npm run build` — **succeeds**, no TypeScript errors (only unrelated Dart Sass `@import` /
  `lighten()`/`darken()` deprecation warnings). Confirms `ChangeDetectionStrategy.Eager` compiles
  and is a valid Angular 22.0.7 strategy.
- `npm run lint` — **clean**, zero ESLint errors/warnings.
- Tests — none yet (being written separately). No test baseline available.

### Verification steps

- Reproduce with a large schedule (e.g. 100+ lines). Use Angular DevTools "Profiler" (or Chrome
  Performance) to confirm change-detection duration per keystroke drops from seconds to <16ms.
- Confirm: clicking Edit opens the editor immediately; typing in the runner search and inputs is
  smooth; availability warning colors and formatted dates/durations still render correctly;
  save/publish still work; drag-drop reorder still recomputes the schedule.

## 5. Compatibility / blast-radius analysis

The components proposed for change are **shared across the whole app**, so the executing LLM must
treat them as shared API and test the downstream screens — not just the edit table.

### Consumers of the shared components

- **`app-simple-md`** — also used in: public schedule list
  (`marathon-schedule-list`), `run-details`, live ticker (`marathon-schedule-current`),
  `submission-category`, `submission-game`.
- **`app-element-temporal-datetime` / `app-element-temporal-duration`** — also used in:
  calendar (`calendar-controller`, `calendar-view-row`, `calendar-view-table`), marathon home
  (`details`), `donations`, submit header, profile history (`moderated`, `submission`,
  `saved-games`), public schedule list, `run-details`, and the newer `schedule-table` /
  `schedule-edit-row`.

### Risk per change

1. **Memoize `simple-md` (pure pipe or `ngOnChanges` cache) — LOW RISK.**
   Every consumer binds `[data]` to a string or a `| translate` output; value changes always change
   the string reference, so `ngOnChanges` / a pure pipe recomputes correctly. Markdown output does
   **not** depend on locale, so there is no hidden refresh dependency. ✅

2. **Memoize temporal components — LOW RISK, with ONE thing to verify.**
   Their output depends on the **runtime locale** (`TemporalServiceService.changeLocale`). Today they
   only re-render on a locale change because Default change detection re-runs the getter every cycle.
   If we cache the formatted string we must ensure a language switch still refreshes them.
   - `LocaleService.useLanguage()` calls `translateRouter.changeLanguage()`, which changes the
     localized route and typically rebuilds views (re-running `ngOnChanges`), so caching should be
     safe.
   - ⚠️ **Safeguard:** either expose a locale-change signal/observable from the temporal service and
     `markForCheck()` on it, **or** manually verify that switching language live still updates
     dates/durations on calendar, donations, and schedule screens. This is the only genuine
     regression risk in the whole plan.

3. **`OnPush` on the shared cell components — SAFE because inputs change by reference.**
   - `[dateTime]="line.date"` / `run.date`: reassigned as new `Temporal` objects in
     `computeSchedule()` → reference changes → OnPush updates. ✅
   - `[duration]`, `[data]`: primitive strings, new value = new reference. ✅
   - Watch only for in-place mutation without reassignment (none found among current consumers).
     Keep the existing `expanded = new Set(expanded)` pattern and add `markForCheck()` /
     array-spread after in-place `lines` mutations in `edit.component.ts`.

4. **Precompute availability flags — NO external impact** (local to the edit table). ✅

5. **Replacing `ChangeDetectionStrategy.Eager` — SCOPE IT DOWN.**
   `Eager` appears in ~20 components. Do **not** do a blanket sweep. Convert only the schedule-edit
   subtree and the specific shared cells being memoized, and test each affected screen. A global
   change multiplies the OnPush regression surface unnecessarily.

### Bottom line

No change touches data models, service contracts, or public/HTTP APIs — this is rendering /
change-detection behavior only. The worst-case failure mode is "a value doesn't visually refresh"
(most plausibly on a live language switch), never broken functionality or data loss.

### Regression test checklist (after implementation)

- Calendar, marathon home, donations table, submit header, profile history, **public** schedule
  list, `run-details` — dates / durations / markdown still render correctly.
- Switch site language live and confirm dates/durations re-render on those pages.
- Edit table: expand/collapse, edit game/category (blur), drag-reorder, add/remove runner,
  availability warning colors, save & publish.

## 6. Files referenced

- `edit/edit.component.ts` / `.html`
- `edit/schedule-table-old-element/schedule-table-old-element.component.ts` / `.html`
- `edit/schedule-table/normal-run-editor/normal-run-editor.component.ts` / `.html`
- `components/simple-md/simple-md.component.ts`
- `elements/temporal/element-temporal-datetime/element-temporal-datetime.component.ts` / `.html`
- `elements/temporal/element-temporal-duration/*`
- `services/termporal/temporal-service.service.ts`
- `assets/table/index.ts`







