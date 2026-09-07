# Test plan — Tic-Tac-Toe

## 1. Purpose

Cover the critical behaviour of the Tic-Tac-Toe web app well enough to say whether it is safe to release, and leave behind an automated suite that can be run on every change.

## 2. System under test

A single self-contained index.html. Everything runs in the browser:

- no backend, no network calls of any kind
- all state is kept in localStorage under the ttt: prefix
- version reported in the console on load: v0.0.9-beta

Storage keys

| Key | Content |
|---|---|
| ttt:users | Map of lowercased name to { name, createdAt, difficulty, history[] } |
| ttt:session | Display name of the logged in player |
| ttt:theme | light or dark |
| ttt:lang | en or fa |

Features

| Area | Behaviour |
|---|---|
| Account | Register and log in by player name only, no password. Names are case-insensitive, minimum 2 characters. Log out. |
| Game | 3x3 board, player is X and always moves first, computer is O. Difficulty easy / medium / hard. New Game, Reset, Get Hint. |
| Profile | Rename the player, view created date and win / loss / draw counters, delete the account. |
| History | Table of finished games with date, difficulty and result. Clear history. |
| Presentation | Light and dark theme, English and Persian, Persian switches the page to RTL. |

The main screen is shown in docs/evidence/game-screen.png, the Persian right-to-left layout in docs/evidence/persian-rtl-dark.png.

## 3. Scope

In scope

Account lifecycle, game rules and results, statistics and history, profile management, theme and language switching, state persistence across reloads, data isolation between players, negative and edge cases, input handling and storage robustness, layout across desktop, tablet and mobile, cross-browser behaviour, the browser console, and keyboard and screen-reader support.

Out of scope

- Load and performance testing - a static page with no backend
- Penetration testing - there is no server, no session token and no authentication secret, so the security work here is input handling, data isolation and storage robustness
- Visual regression baselines - no reference build was provided
- Internet Explorer and legacy engines - not supported by the toolchain

## 4. Approach

Testing runs in three passes.

1. Exploratory pass. Work through every screen manually, in both languages and both
themes, with the DevTools console open. This is where the defects in
bug-report.md came from.
2. Test case design. Turn the explored behaviour into the cases in
test-cases.md, assigning priority by risk.
3. Automation. Automate the critical flows, both as isolated specs and as one
end-to-end journey. Cases that are not reliably reproducible, or that need a human eye,
stay manual and are marked as such.

The isolated specs and the end-to-end journey are both needed. Isolated specs say which step is broken; the journey catches the problems that only appear when steps run together. BUG-009, the most serious defect found, was invisible to every isolated spec. The suite carries 14 such journeys, E2E-01 to E2E-14.

The app exposes data-testid on every meaningful element, plus data-status on the status line and data-state on each cell. Automation uses those rather than visible text, so the tests survive copy changes and work in either language.

## 5. Risk-based priority

| Risk | Impact | Priority of the related cases |
|---|---|---|
| A finished game is scored or | Core value of the app is wrong | P1 |
| recorded incorrectly |  |  |
| A player can act out of turn, or a | Game rules broken | P1 |
| placed mark can be overwritten |  |  |
| Account data is lost or leaks | Data loss | P1 |
| between players |  |  |
| Registration or login lets in an | Account integrity | P1 |
| invalid or duplicate name |  |  |
| Destructive actions run without | Data loss | P1 |
| confirmation |  |  |
| Difficulty does not change the | Feature does not deliver | P2 |
| opponent's strength |  |  |
| Theme or language is not kept after | Annoyance | P2 |
| a reload |  |  |
| Layout breaks on long input or | Usability | P2 |
| small screens |  |  |
| Localisation gaps | Cosmetic | P3 |

## 6. Environment

| Item | Value |
|---|---|
| App | app/index.html, served over HTTP at http://127.0.0.1:4173 |
| Browsers | Chromium 151, Firefox and WebKit (Playwright bundled builds) |
| Node.js | 18+ |
| Desktop viewport | 1280x720 |
| Mobile | Pixel 5 (393x727) and iPhone 13 (390x664), both with touch |
| Tablet | iPad gen 7, landscape (1080x810) |
| OS used for the manual pass | Windows 11 |

The app is served over HTTP rather than opened as file:// so that localStorage behaves the same way it would in production.

## 7. Test data

No fixtures or seeding are needed. Every Playwright test gets a fresh browser context, so localStorage starts empty and each test registers the players it needs. Player names used in the suite are Vlad, Vladyslav and Bob.

## 8. Entry and exit criteria

Entry - the app loads with no console errors and the auth form is reachable.

Exit

- All P1 cases pass, automated or manual
- No open P1 defect
- The automated suite is green in every project, three runs in a row, no flaky tests
- Every known defect is written up with steps and expected behaviour

## 9. Automation scope

Automated: registration and login including validation, logout, session persistence, the full game loop with win and loss, board locking during the computer's turn, New Game and Reset, hint, difficulty change and its confirmation, history contents and clearing, per-player isolation, profile statistics, rename including the duplicate-name refusal, account deletion, theme and language switching and their persistence, the negative and cancel paths, input escaping, storage robustness, keyboard and ARIA support, and layout at every supported viewport.

The automation is 14 end-to-end journeys, E2E-01 to E2E-14, not one test per behaviour. Each is a single test built from chained steps, and between them they carry 80 of the 98 cases. Every journey runs in six projects, so cross-browser, mobile and tablet coverage comes from the same 14 cases rather than a separate suite: chromium, firefox, webkit, mobile-chrome, mobile-safari and tablet - 84 test runs in total.

Left manual, with reasons:

| Area | Reason |
|---|---|
| Draw result | Could not be forced against this opponent - see notes.md |
| Visual and layout review | Needs a human eye; no visual baseline exists |
| Colour contrast and readability in both themes | Subjective judgement |
| Screen-reader announcements | Automation can check the attributes, not the announcement |
| Console inspection during a full manual pass | Cheap to do by hand, and it caught nothing automated would miss |

## 10. Deliverables

Test plan, test cases, defect report, notes on the automation approach, and the Playwright suite with an HTML report.

## 11. Schedule

Fits the three-day box.

| Day | Work |
|---|---|
| 1 | Exploratory testing, defect logging, test plan |
| 2 | Test case design, project setup, page objects, first journeys |
| 3 | Remaining journeys, cross-browser runs, stability runs, documentation |
