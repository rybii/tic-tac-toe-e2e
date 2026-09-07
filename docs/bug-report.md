# Defects

Found during the exploratory pass. Environment: Chromium 151 (Playwright 1.62 build), Windows 11, app/index.html version v0.0.9-beta, served at http://127.0.0.1:4173.

Severity is about impact on the user, priority is my suggestion for fixing order.

| ID | Title | Severity | Priority |
|---|---|---|---|
| BUG-009 | On Hard the computer overwrites the mark the player just placed | Critical | Highest |
| BUG-001 | The name field is cleared after every validation error | Minor | Medium |
| BUG-002 | The two forms validate in two different ways | Minor | Low |
| BUG-003 | Hard difficulty is not hard, and is weaker than Medium | Major | High |
| BUG-004 | Persian localisation misses the header subtitle | Minor | Low |
| BUG-005 | A long player name breaks the page layout | Minor | Medium |
| BUG-006 | Reset and New Game do the same thing, but Reset looks destructive | Minor | Low |
| BUG-007 | Validation errors are not linked to the field for screen readers | Minor | Medium |
| BUG-008 | The active navigation tab is not exposed to assistive tech | Minor | Low |

---

## BUG-009 — On Hard the computer overwrites the mark the player just placed

Severity: Critical Priority: Highest Area: Gameplay

Steps

1. Register and set difficulty to Hard.
2. Take the centre cell (index 4).
3. Wait for the computer to reply.
4. Take the top-right cell (index 2).

Actual - the X placed on cell 2 is replaced by an O. The player loses the move and the computer effectively gets two moves in a row. A DOM trace of the exchange:

```
+8525ms   eeeexeeee | computer-thinking     player's X lands on cell 4
+8979ms   oeeexeeee | your-turn             computer takes cell 0
+13707ms  oexexeeee | computer-thinking     player's X lands on cell 2
+14179ms  oeoexeeee | your-turn             cell 2 flips from X to O
```

The board ends with two O and one X while the status still reads Your turn (X).

Expected - a cell that already holds a mark can never be taken again, by either side. Each exchange adds exactly one X and one O.

Reproducibility - deterministic for particular openings, and only on Hard:

| Player's first two moves | Difficulty | Games with an overwrite |
|---|---|---|
| 4 then 2 | Hard | 10 of 10 |
| 0 then 4 | Hard | 10 of 10 |
| 4 then 1, 4 then 0, 4 then 6, 4 then 8 | Hard | 0 of 10 |

Across random play it hit 3 of 15 games on Hard, about 6% of all player moves. Easy and Medium were clean over 62 and 58 moves respectively.

| Difficulty | Games | Games affected | Player moves | Moves overwritten |
|---|---|---|---|---|
| Easy | 15 | 0 | 62 | 0 |
| Medium | 15 | 0 | 58 | 0 |
| Hard | 15 | 3 | 53 | 3 |

The clearest case came from random play: on a completely empty board the player takes cell 0, and the board ends up holding a single O on cell 0 and no X at all.

Likely cause - the Hard opponent appears to choose its move from a snapshot of the board taken before the player's move is applied, so it can select the cell the player has just filled and then write over it. That would explain why it is deterministic per opening and why only the Hard strategy is affected. This is a hypothesis from the outside; the observable behaviour above is what matters.

Notes - found by playing a normal game by hand rather than by asserting one behaviour at a time. The isolated specs all passed because none of them checked that a mark stays put across the opponent's turn. Covered by GAME-15 and GAME-16.

---

## BUG-001 — The name field is cleared after every validation error

Severity: Minor Priority: Medium Area: Registration and login

Steps

1. Open the app.
2. Type J in the player name field.
3. Press Create Account.

Actual - the error Name must be at least 2 characters. is shown and the field is emptied. The same happens for every other validation error, and on the login form.

Expected - the entered text stays so the player can correct it instead of retyping.

Notes - the error message asks the player to fix the name but removes the thing they have to fix. It gets worse the longer the name is. Covered by AUTH-11.

---

## BUG-002 — The two forms validate in two different ways

Severity: Minor Priority: Low Area: Registration and Profile

Steps

1. On the auth form, enter J and press Create Account.
2. Register properly, open Profile, replace the display name with a and press Save
Changes.

Actual - two different mechanisms for the same rule. The auth form sets novalidate on the form and renders its own message in auth-error, styled to match the app. The profile form leaves native validation on, so the browser blocks the submit and shows its own grey tooltip, Please lengthen this text to 2 characters or more (you are currently using 1 character).

Both inputs carry required minlength="2", so the rule itself is consistent; only the reporting differs.

Expected - one style of validation message across the app. The in-page style used by the auth form is the better of the two: it is translated, it matches the design, and it survives a screenshot comparison.

Notes - the native tooltip is not translated, so in Persian the user gets an English browser message next to a fully translated form. This was originally logged as a silent failure; that was wrong. The rename does report duplicate names correctly through profile-error with the message Another account already uses this name., and the input is reset to the current name. See "Checked and working". Covered by PROF-06 and PROF-07.

---

## BUG-003 — Hard difficulty is not hard, and is weaker than Medium

Severity: Major Priority: High Area: Gameplay

Steps

1. Register and set difficulty to Hard.
2. Play cells 0, 2, 4, 6 in that order (top-left, top-right, centre, bottom-left).

Actual - the player wins every time. Two independent checks:

| Strategy on Hard | Games | Player wins |
|---|---|---|
| Fixed sequence 0, 2, 4, 6 | 10 | 10 |
| Always take the last free cell | 14 | 14 |
| Take the win, else block, else centre | 15 | 15 |

The computer answers the opening move on cell 1 almost every time, which is a weak reply, and it does not defend against a fork: after the player holds 0, 2 and 4 there are two winning lines open and only one gets blocked.

Medium is measurably stronger. Taking two cells in a row and checking whether the computer takes the third:

| Difficulty | Blocked an immediate win |
|---|---|
| Easy | 0 of 5 |
| Medium | 4 of 5 |
| Hard | did not block the fork in any of 15 games |

Expected - Hard should be at least as strong as Medium. A 3x3 board is small enough for a perfect opponent, so Hard should never lose; at minimum it must block a fork and open on the centre.

Notes - Easy never blocking looks intentional and is fine for an easy mode. The problem is the ordering: Hard is currently the easiest of the three. Covered by GAME-14, and the automated win test relies on this behaviour, so it will need revisiting once the AI is fixed - noted in notes.md.

---

## BUG-004 — Persian localisation misses the header subtitle

Severity: Minor Priority: Low Area: Localisation

Steps

1. Switch the language selector to Persian.

Actual - navigation, buttons, status line, profile and history are all translated and the page correctly flips to RTL, but the header subtitle stays A small game for test automation. The screen-reader-only label on the language selector also stays Language.

Expected - every visible string, and the accessible label, follow the selected language.

Notes - the Tic-Tac-Toe heading staying in Latin script is fine, it reads as a product name. Evidence: evidence/persian-rtl-dark.png. Covered by SET-05.

---

## BUG-005 — A long player name breaks the page layout

Severity: Minor Priority: Medium Area: Layout

Steps

1. Register with a 132-character name, for example Bartholomew repeated 12 times.

Actual - the greeting is rendered in full on one line. The navigation bar grows to 1129 px inside a 640 px card, pushes the buttons outside the card, and the page itself becomes horizontally scrollable (document width 1473 px in a 1280 px viewport).

Expected - either a maximum length on the name field, or the greeting truncated with an ellipsis so the navigation stays inside the card.

Notes - there is no upper bound on the name at all. Related and worth deciding on: the field also accepts markup and control characters. Output is correctly escaped, <img src=x onerror=...> is rendered as text and does not execute, so this is a layout problem and not a security one. Evidence: evidence/bug-005-long-name-overflow.png. Covered by UI-02.

---

## BUG-006 — Reset and New Game do the same thing, but Reset looks destructive

Severity: Minor Priority: Low Area: Gameplay

Steps

1. Make a move.
2. Press Reset, then repeat and press New Game.

Actual - both buttons clear the current board, keep the history and the statistics, and neither asks for confirmation. Reset is styled with the danger class and rendered in red, next to the primary New Game button.

Expected - either the two actions differ, or one of them is removed. If Reset is meant to wipe history or statistics it should do that and ask for confirmation first, the way Clear History and Delete Account already do.

Notes - as it stands the red button suggests data loss that never happens, and the two buttons compete for the same job. Covered by GAME-17.

---

## BUG-007 — Validation errors are not linked to the field for screen readers

Severity: Minor Priority: Medium Area: Accessibility

Steps

1. Submit the auth form with an invalid name.
2. Inspect input-name.

Actual - the error appears in a separate auth-error block. The input has no aria-invalid, no aria-describedby pointing at the error, and the error container has no live region role. The field also keeps its normal border, so there is no visual error state on the control itself either. A screen-reader user moving through the form is told nothing is wrong.

Expected - aria-invalid="true" on the input while it is in error, aria-describedby referencing the error element, and the error container announced, for example with role="alert".

Notes - the rest of the app is good on this front, which makes the gap stand out: the game status is role="status" with aria-live="polite" and every cell has a proper aria-label. Covered by A11Y-02.

---

## BUG-008 — The active navigation tab is not exposed to assistive tech

Severity: Minor Priority: Low Area: Accessibility

Steps

1. Log in and read the accessibility tree for the navigation.

Actual - the current view is shown visually with an is-active class on the button, but the accessibility tree contains four plain buttons with nothing marking which one is current:

```
- button "Play"
- button "Profile"
- button "History"
- button "Log Out"
```

Expected - aria-current="page" on the active button, or a tablist with aria-selected, so the current view is announced.

Notes - found by reading the accessibility snapshot rather than the DOM. Covered by A11Y-03.

---

## Smaller usability observations

Not raised as defects, but worth a look when the above are fixed.

- Log in mode is barely signposted. Switching to Log In keeps the heading Welcome and the subtitle Enter your name to start playing. Only the button label and the bottom link change, so it is easy to think you are still registering. Covered by UI-05.
- The hint is easy to miss. It is a pale amber border with no text, and it clears itself after about a second. A player can press Get Hint and reasonably believe nothing happened.
- Disabled cells look identical to active ones while the computer moves. The lock works, but clicking gives no feedback.
- Alignment on the Play screen. The DIFFICULTY label and its select sit flush left while the status bar and board are full width, so the toolbar looks detached from the rest.
- Statistics labels are singular - Win, Loss, Draw above counters that are counts.
- The version line v0.0.9-beta is logged to the console on every load.

## Checked and working

Worth recording, since these were the risky areas:

- No network activity of any kind, and no console errors or warnings during any flow. The only console output is the version line v0.0.9-beta, which should probably not ship.
- Player input is HTML-escaped on output; no XSS through the name field.
- Accounts are isolated. Deleting one account leaves the others and their history intact.
- Renaming carries the history and the statistics over to the new name, and renaming to a name another account owns is refused with Another account already uses this name.
- Destructive actions, Clear History and Delete Account, both confirm first. Cancelling any confirm, including the difficulty change, leaves the data and the control untouched.
- The board is genuinely locked while the computer moves. Every cell is disabled with aria-disabled="true", and even a scripted click() during that window is ignored.
- Theme, language, difficulty and session all survive a reload. The document title is translated as well.
- Corrupted localStorage is handled. Invalid JSON in ttt:users, or a ttt:session pointing at an account that no longer exists, both fall back to the auth form with no crash and no console error.
- The board is keyboard operable, cells carry aria-label like row 1, column 1, empty, and the status line is role="status" with aria-live="polite".
- Layout has no horizontal scrolling at any supported size: 1280x720 desktop, 393x727 and 390x664 phone, 1080x810 tablet.
