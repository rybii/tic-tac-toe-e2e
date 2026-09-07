# Notes on the approach

Optional document from the task description. It covers the decisions that are not obvious from the code.

## Framework

Playwright with TypeScript. The app is a single page with no backend, so the choice comes down to ergonomics: auto-waiting and web-first assertions remove most of the sleeps this app would otherwise need, native confirm() dialogs are handled properly, and the trace viewer makes a failed run easy to read without rerunning it. TypeScript keeps the page objects and the shared types honest.

## Locators

The app already ships data-testid on everything that matters, so that is what the suite uses. Two extra hooks turned out to be more valuable than the visible text:

- data-status on the status line: your-turn, computer-thinking, human, computer, draw
- data-state on each cell: empty, x, o

Asserting on those instead of on You win! means the tests keep working in Persian and do not break when the copy changes. Visible text is still asserted where the text itself is the thing under test, for example the validation messages and the Persian navigation.

## Waiting for the computer

After the player moves, the board is locked for about half a second while the status line reads Computer thinking.... Clicking during that window does nothing, which is exactly the sort of thing that produces a flaky suite.

Every action in GamePage ends with:

```
await expect(this.status).not.toHaveAttribute('data-status', 'computer-thinking');
```

There is no fixed timeout anywhere in the suite.

## Forcing a win and a loss

Test cases need a deterministic win and a deterministic loss, and this opponent is not fully deterministic - the same opening does not always get the same reply. Fixed move sequences looked stable at first and then failed once a second game ran in the same session, so they were replaced by two small strategies in helpers/strategy.ts:

- moveToWin - take the winning cell, otherwise block, otherwise centre then corners
- moveToLose - stay out of the top row and never block, so the computer can finish a line

Both are pure functions over the board state and are easy to read. Measured over 15 games each on Hard, both produced the intended result every time, and the suite has been green on three consecutive full runs.

This does lean on BUG-003: the opponent is weak enough that a simple strategy always beats it. When that bug is fixed, the win test will need a different approach - the honest one being to drop the computer opponent from that test and assert the win through a seeded board, if the app ever exposes one.

## Draw

Not automated. 40 random full games on Hard produced no draw, and there is no way to seed a board position from the outside, so any automated draw test would either be flaky or take an unbounded number of attempts. It stays as manual case GAME-06.

## Dialogs

Changing difficulty, clearing history and deleting an account all use native confirm(). Playwright dismisses dialogs by default, which silently cancels those actions and makes the test fail somewhere else entirely. DialogHandler accepts every dialog and records the messages, so tests can assert what the user was asked:

```
expect(dialogs.messages).toContain('Clear all game history?');
```

It also exposes cancelNext(), which is what E2E-10 uses to check that pressing Cancel really does leave the data alone.

An earlier version registered a one-shot handler per action. That broke as soon as an action did not raise a dialog, because the unused handler stayed armed and fired on the next one.

## Checking the DOM was not enough

The first pass over the profile form was done by reading the DOM, and it produced a wrong defect: renaming to a one-character name appeared to do nothing at all, so it was logged as a silent failure. Walking the same form by hand showed what was really happening - the profile input carries required minlength="2" and its form does not set novalidate, so the browser blocks the submit and shows a native tooltip. A tooltip is not in the DOM, and the DOM-only check could not see it.

The duplicate-name case was wrong for a different reason: the app reports it through profile-error, and the first check only looked at profile-message.

Both were corrected, and BUG-002 is now about the two forms validating in two different ways rather than about anything being silent. Two habits came out of it: assert on a screenshot or the accessibility tree as well as the DOM, and when an action seems to do nothing, check validity before writing it up.

## Cross-browser, mobile and tablet

Rather than a separate responsive suite, the config declares six projects and all 14 journeys run in every one of them:

| Project | Engine | Device | Viewport | Touch |
|---|---|---|---|---|
| chromium | Chromium | Desktop Chrome | 1280x720 | no |
| firefox | Gecko | Desktop Firefox | 1280x720 | no |
| webkit | WebKit | Desktop Safari | 1280x720 | no |
| mobile-chrome | Chromium | Pixel 5 | 393x727 | yes |
| mobile-safari | WebKit | iPhone 13 | 390x664 | yes |
| tablet | WebKit | iPad gen 7, landscape | 1080x810 | yes |

That covers all three rendering engines Playwright ships - Chromium, Gecko and WebKit - and three form factors. The mobile and tablet projects set isMobile and hasTouch, so taps go through the touch path rather than synthetic mouse events.

That is 84 test runs in about two and a half minutes, and it means the layout and keyboard assertions in E2E-14 are executed at every supported size instead of being simulated with setViewportSize inside one project. No behaviour differed between engines.

## Security scope

There is no backend, no session token and nothing to authenticate against, so penetration testing would be theatre. What is worth testing is what the app actually does with input and storage: names are rendered through innerHTML, so the journeys check that markup in a name is escaped rather than executed and that the app talks to no origin but its own (E2E-12), that data does not leak between accounts (E2E-09), and that corrupted localStorage does not break the page (E2E-11).

## Isolated specs missed a critical bug

The first version of this suite was written as isolated checks: one behaviour per test, each starting from a clean context. There were 384 of them across six browsers, all passing, and they still missed BUG-009 - the computer overwriting the mark the player has just placed.

The reason is that no isolated test ever asked the one question that matters here: does a mark stay put across the opponent's turn? Each spec asserted its own step and stopped.

tests/specs/e2e/ is the answer to that: 14 journeys, each a single test made of chained steps, grouped into four files by theme - account, gameplay, data, presentation. Every one of them reads the game's own result rather than assuming a win, so they stay stable whatever the opponent does.

Writing them paid off immediately beyond BUG-009. E2E-07 failed on its first run because I had assumed changing difficulty always asks for confirmation. It does not: the confirm only appears while a game is in progress, never after one has finished or on an empty board. The app was right and the assumption was wrong, and the journey is what surfaced it. That case now covers both behaviours.

BUG-009 is not encoded as a test. The suite asserts correct behaviour only, so a test that passes because the app is broken would be misleading once it is fixed. The bug is written up instead with a reproduction that is deterministic rather than intermittent: under random play it hits about 6% of moves, but the player playing cell 4 then cell 2 on Hard reproduces it 10 times out of 10, while four other openings never do. That makes it a one-line regression test to add the day the fix lands.

## Keeping the journeys stable

Long journeys give flakiness more places to hide, so three sources were found and removed rather than papered over with retries.

- Assuming an outcome. playToWin on Easy can end in a draw, and three journeys asserted a win. They now read the game's own result and assert the matching history row and counter. Where a specific outcome is genuinely needed, the journey uses Hard, where the strategy won 20 games out of 20 on both Chromium and WebKit.
- Reading a transient state too late. E2E-14 checked that cells are aria-disabled while the computer replies, but by then the reply had often landed. That check belongs in E2E-08, where it runs inside a single page.evaluate and is therefore atomic. E2E-14 now asserts the stable fact instead: an occupied cell stays disabled.
- Reading an async side effect immediately. The dialog handler records confirm messages in a listener, so asserting dialogs.messages straight after the action was a race. Those assertions use expect.poll now.

One failure was not a logic problem at all: a single WebKit journey timed out during a full six-project run, then passed 24 times out of 24 when repeated on its own. Each journey plays several games with a deliberate half-second opponent delay, and the default 30 s test timeout is tight when six projects run at once. The config now allows 90 s per journey and 10 s per assertion, which is honest for this shape of test.

## Test isolation

Each Playwright test gets a fresh browser context, so localStorage starts empty and no cleanup is needed. Tests register the players they need through the UI; a player fixture does that for the specs that only care about the logged-in state. Everything runs in parallel.

## Structure

Specs hold assertions and nothing else. Below them the code is split by responsibility:

| Layer | Holds | Example |
|---|---|---|
| `pages/` | Selectors, and single interactions with an element | `GamePage.clickCell(4)` |
| `features/` | Whole player actions built from those interactions | `GameFeature.playToWin()` |
| `helpers/` | Logic with no page in it at all | `moveToWin(board)` |

The board is the only part of the app with real behaviour behind it, so `GameFeature` is the
only feature class. `GamePage` exposes the locators and the small actions - click a cell,
pick a difficulty, read the board, wait out the opponent's turn - and knows nothing about
what a game is. `GameFeature` composes those into `mark`, `selectDifficulty`, `playToWin`,
`playToLose` and `result`, and it is the layer wrapped in `test.step()`, so the report reads
as player actions rather than clicks.

Keeping the two apart matters when the markup changes: a renamed `data-testid` is a one-line
edit in the page object and nothing else moves. It also keeps the strategy in
`helpers/strategy.ts` as pure functions over a board array, testable without a browser.

The other screens are thin - a form and a table each - so they stay as plain page objects
with no feature layer above them.

## Known-bug tests

An earlier version marked known defects with test.fail() so they would start failing once fixed. That was dropped when the suite was reduced to the 14 journeys: test.fail() applies to a whole test, and a journey covering twelve stages cannot be marked as expected-to-fail because of one of them. The defects are carried in bug-report.md instead, and the affected cases in test-cases.md are marked "Manual - open defect BUG-nnn". The removed form looked like this:

```
test('keeps the typed name after a validation error', async ({ auth }) => {
  test.fail(true, 'BUG-001: the name field is cleared on every validation error');
  ...
});
```

That form has the nice property of failing the moment a bug is fixed, which is a reminder to delete it. It is worth restoring per defect once the journeys are not the only automation, but a journey cannot carry it, so the bug report holds that job for now. Each defect there has steps precise enough to turn into a test in one sitting; BUG-009 in particular has an opening that reproduces it 10 times out of 10.

## What I would add next

- A CI workflow publishing the HTML report as an artifact
- Axe accessibility checks on each view, to catch the class of issue BUG-007 and BUG-008 belong to automatically
- Visual snapshots for the two themes and both text directions, once there is a build to use as a baseline
