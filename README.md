# Tic-Tac-Toe — test plan, test cases and E2E automation

Take-home task for the Senior Test Engineer role. The system under test is the single index.html file supplied in the task archive; it is kept unchanged in app/.

Stack: Playwright + TypeScript.

## Contents

| Path | What is inside |
|---|---|
| docs/test-plan.md | Scope, risks, approach, entry/exit criteria |
| docs/test-cases.md | 98 test cases, 80 of them automated |
| docs/bug-report.md | 9 defects, including a critical gameplay bug |
| docs/notes.md | Why the automation is built the way it is |
| tests/ | Page objects, features, fixtures, helpers and specs |
| app/ | The SUT, served locally during the run |

## Running

Requires Node.js 18 or newer.

```
npm ci
npx playwright install
npm test
```

npm test starts a local static server for app/ on http://127.0.0.1:4173 and runs the suite against it. No other setup is needed.

Useful variations:

```
npm run test:chromium  # one browser, fastest feedback loop
npm run test:desktop   # chromium + firefox + webkit
npm run test:mobile    # Pixel 5 + iPhone 13 + iPad
npm run test:headed    # watch the browser
npm run test:ui        # Playwright UI mode
npm run report         # open the HTML report of the last run
npm run typecheck      # tsc --noEmit
npm run serve          # just serve the app for manual testing
```

## Results

14 end-to-end journeys, run in six browser projects - 84 passed, 0 failed, about 2.8 minutes, green on three consecutive runs.

| Project | Engine | Device | Viewport | Touch |
|---|---|---|---|---|
| chromium | Chromium | Desktop Chrome | 1280x720 | no |
| firefox | Gecko | Desktop Firefox | 1280x720 | no |
| webkit | WebKit | Desktop Safari | 1280x720 | no |
| mobile-chrome | Chromium | Pixel 5 | 393x727 | yes |
| mobile-safari | WebKit | iPhone 13 | 390x664 | yes |
| tablet | WebKit | iPad gen 7, landscape | 1080x810 | yes |

All 14 pass. The suite asserts correct behaviour only, so the open defects are not encoded as passing tests; each one is written up in bug-report.md with steps that reproduce it, and the affected cases in test-cases.md are marked "Manual - open defect BUG-nnn". BUG-009 has a deterministic reproduction (play cell 4, then cell 2, on Hard) and is ready to become a regression test the moment it is fixed.

## Test structure

```
tests/
├── data/app.ts               types, storage keys, board constants
├── fixtures/test.ts          page objects, features, dialogs, logged-in player
├── pages/                    selectors and single element interactions
├── features/
│   └── GameFeature.ts        whole player actions built on GamePage
├── helpers/
│   ├── strategy.ts           move selection used to force a win or a loss
│   └── DialogHandler.ts      accepts confirms, and cancels one on request
└── specs/e2e/                    the 14 journeys
    ├── account.e2e.spec.ts       E2E-01 to E2E-04  account lifecycle
    ├── gameplay.e2e.spec.ts      E2E-05 to E2E-08  playing and its results
    ├── data.e2e.spec.ts          E2E-09 to E2E-12  isolation, deletion, storage, input
    └── presentation.e2e.spec.ts  E2E-13, E2E-14    theme, language, keyboard, layout
```

Each journey is a single test made of chained test.step() calls, so the HTML report reads as a sequence of user actions rather than clicks and selectors. Specs contain assertions only. Page objects own the selectors and the single interactions; GameFeature owns the player actions built from them, such as playToWin. The split is explained in notes.md.

The automation is journeys rather than one test per behaviour on purpose. Isolated checks pass individually and still miss what only breaks in combination. An earlier version of this suite was written that way, 64 checks per browser, and every one of them passed while BUG-009 sat there undetected: no isolated check ever asked whether a mark stays put across the opponent's turn. It was caught the first time a whole game was played through in one sitting. Where a journey fails, the failing test.step() names the stage, so the report still points at the broken step.

## Manual testing

The automation came after an exploratory pass done by hand, in both languages and both themes, with the browser console open. That is where all nine defects in bug-report.md came from, including BUG-009, which no assertion had been written for at the time. The approach is set out in section 4 of test-plan.md, and the cases that are still executed by hand are marked Manual in test-cases.md with the reason.
