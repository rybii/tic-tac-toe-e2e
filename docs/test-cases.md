# Test cases

98 cases in total, covered by 14 automated end-to-end journeys. Priority follows the risk table in test-plan.md.

## What is automated

80 of 98 cases are automated (82%), and every one of them is covered by one of the 14 journeys in tests/specs/e2e/. There is no separate per-behaviour suite: the journeys are the automation. The Status line on each case names the journey or journeys that cover it.

| Status | Cases | Meaning |
|---|---|---|
| Automated - E2E-nn | 80 | Covered by that journey and passing |
| Manual | 8 | Executed by hand |
| Manual - open defect BUG-nnn | 10 | Executed by hand; the app fails the case today |

The 14 journeys, and the areas each one carries:

| Journey | Area it covers |
|---|---|
| E2E-01 | Critical path end to end: register, play, record, rename, persist, delete |
| E2E-02 | Sign-up and login validation, session, logout |
| E2E-03 | Rename: duplicate refused, short blocked, valid carried across |
| E2E-04 | Returning player, statistics accumulating over sessions |
| E2E-05 | Winning run, board locking, record and counters |
| E2E-06 | Losing run on Hard, then a second game alongside it |
| E2E-07 | All three difficulties, the confirm and the abandoned game |
| E2E-08 | Turn rules: hint, board locked during the reply, Reset, New Game |
| E2E-09 | Two players, data isolation and deletion |
| E2E-10 | Destructive actions, cancel and confirm |
| E2E-11 | Damaged storage, fallback and recovery |
| E2E-12 | Hostile input escaping and outbound traffic |
| E2E-13 | Theme and language across every view |
| E2E-14 | Keyboard, ARIA and layout at the current viewport |

All 14 run in six browser projects, which is where the cross-browser, mobile and tablet coverage comes from: 84 test runs in total.

Spec files:

| File | Journeys |
|---|---|
| tests/specs/e2e/account.e2e.spec.ts | E2E-01 to E2E-0 |
| tests/specs/e2e/gameplay.e2e.spec.ts | E2E-05 to E2E-0 |
| tests/specs/e2e/data.e2e.spec.ts | E2E-09 to E2E-1 |
| tests/specs/e2e/presentation.e2e.spec. | E2E-13 and E2E- |

Common precondition for every case: the app is open at http://127.0.0.1:4173 with empty localStorage, unless the steps say otherwise.

---

## Account

| ID | Title | Pri | Steps | Expected result | Status |
|---|---|---|---|---|---|
| AUTH-01 | Register a new player | P1 | 1. Enter Vlad. 2. Press Create Account. | Auth form is replaced by the game. Greeting reads Hello, Vlad. ttt:session is Vlad and ttt:users contains key vlad. | Automated - E2E-01, E2E-02 |
| AUTH-02 | Register with the shortest allowed name | P2 | 1. Enter Jo. 2. Press Create Account. | Registration succeeds, greeting reads Hello, Jo. | Manual |
| AUTH-03 | Register with an empty name | P1 | 1. Leave the field empty. 2. Press Create Account. | Error Please enter a name. The player stays on the auth form. | Automated - E2E-02 |
| AUTH-04 | Register with one character | P1 | 1. Enter J. 2. Press Create Account. | Error Name must be at least 2 characters. | Automated - E2E-02 |
| AUTH-05 | Register with spaces only | P1 | 1. Enter three spaces. 2. Press Create Account. | Error Please enter a name. Whitespace is trimmed before validation. | Automated - E2E-02 |
| AUTH-06 | Register a name that already exists | P1 | 1. Register Vlad. 2. Log out. 3. Enter vlad. 4. Press Create Account. | Error This name is already taken. Try logging in. No second account is created. | Automated - E2E-02 |
| AUTH-07 | Log in ignoring letter case | P1 | 1. Register Vlad. 2. Log out. 3. Switch to Log in. 4. Enter VLAD and submit. | Logged in. Greeting keeps the original spelling, Hello, Vlad. | Automated - E2E-02 |
| AUTH-08 | Log in with an unknown name | P1 | 1. Switch to Log in. 2. Enter ghost and submit. | Error No account with this name. Please register. | Automated - E2E-02 |
| AUTH-09 | Log out | P1 | 1. Register Vlad. 2. Press Log Out. | Auth form is shown, navigation is hidden, ttt:session is removed. The account itself is kept. | Automated - E2E-02 |
| AUTH-10 | Session survives a reload | P1 | 1. Register Vlad. 2. Reload the page. | Still logged in, greeting reads Hello, Vlad. | Automated - E2E-02 |
| AUTH-11 | Typed name is kept after a validation error | P2 | 1. Enter J. 2. Press Create Account. | The field still contains J so it can be corrected. Fails today - BUG-001. | Manual - open defect BUG-001 |
| AUTH-12 | Switch between Create Account and Log in | P3 | 1. Press Already have an account? Log in. 2. Press New player? Create an account. | The submit button and the link text swap each time. Any previous error is cleared. | Manual |

---

## Gameplay

Unless stated otherwise, difficulty is set to Hard first so that the outcome is repeatable.

| ID | Title | Pri | Steps | Expected result | Status |
|---|---|---|---|---|---|
| GAME-01 | Board starts empty | P1 | 1. Register and open Play. | 9 empty cells, status Your turn (X) with data-status="your-turn". | Automated - E2E-05 |
| GAME-02 | Player move is answered by the computer | P1 | 1. Click the centre cell. | Clicked cell becomes X. Exactly one O appears. Turn returns to the player. | Automated - E2E-08 |
| GAME-03 | An occupied cell cannot be taken again | P1 | 1. Click cell 4. 2. Try to click cell 4 again. | The cell is disabled and its mark does not change. | Automated - E2E-08 |
| GAME-04 | Player wins | P1 | 1. Play until three X in a line. | Status You win! with data-status="human". The three winning cells get the is- win highlight. | Automated - E2E-05 |
| GAME-05 | Computer wins | P1 | 1. Play without blocking until three O in a line. | Status Computer wins. with data-status="computer". | Automated - E2E-06 |
| GAME-06 | Draw | P2 | 1. Fill the whole board with no line completed. | Status shows a draw and the draw counter increases by one. | Manual |
| GAME-07 | Board locks after the game ends | P1 | 1. Win a game. 2. Try to click any cell. | All nine cells are disabled, the board does not change. | Automated - E2E-05 |
| GAME-08 | New Game clears the board | P1 | 1. Finish a game. 2. Press New Game. | Empty board, status back to Your turn (X). The finished game stays in history. | Automated - E2E-05, E2E-08 |
| GAME-09 | Reset clears the board and keeps history | P2 | 1. Finish a game. 2. Press Reset. 3. Open History. | Board is cleared, the earlier game is still listed. Reset only affects the current board. | Automated - E2E-08 |
| GAME-10 | Get Hint highlights a free cell | P2 | 1. Press Get Hint. | Exactly one empty cell is highlighted. The hint does not place a mark. | Automated - E2E-08 |
| GAME-11 | The hint highlight disappears on its own | P3 | 1. Press Get Hint. 2. Wait about two seconds. | The highlight clears after roughly one second and the board is otherwise unchanged. | Manual |
| GAME-12 | Changing difficulty is confirmed and restarts the game | P2 | 1. Make a move. 2. Change difficulty. 3. Accept the confirm. | Confirm reads Change difficulty and start a new game?. After accepting, the board is empty and the new difficulty is selected. | Automated - E2E-07 |
| GAME-13 | Difficulty is kept after a reload | P2 | 1. Set Hard. 2. Reload. | Hard is still selected. It is stored per account in ttt:users. | Automated - E2E-07 |
| GAME-14 | Difficulty actually changes the opponent | P2 | 1. On each difficulty, take two cells in a row and see whether the computer takes the third. | Blocking should get more reliable from Easy to Hard. Fails today - BUG-003. | Manual - open defect BUG-003 |
| GAME-15 | A placed mark is never overwritten | P1 | 1. Set Hard. 2. Take cell 4. 3. Wait for the reply. 4. Take cell 2. | Cell 2 still holds X after the computer replies. Fails today - BUG-009. | Manual - open defect BUG-009 |
| GAME-16 | Each exchange adds one X and one O | P1 | 1. Set Hard. 2. Take cell 4, then cell 2. | The board holds two X and two O. Fails today - BUG-009. | Manual - open defect BUG-009 |
| GAME-17 | Reset and New Game are distinguishable | P3 | 1. Make a move. 2. Press Reset and note the effect. 3. Repeat and press New Game instead. | The two buttons should differ, or only one of them should exist. Today both clear the board, keep history and statistics, and neither confirms, yet Reset is styled as a destructive action. Fails today - BUG-006. | Manual - open defect BUG-006 |

---

## Profile

| ID | Title | Pri | Steps | Expected result | Status |
|---|---|---|---|---|---|
| PROF-01 | Profile shows the player and empty counters | P2 | 1. Register. 2. Open Profile. | Name field holds the current name, created date is filled, win / loss / draw are all 0. | Automated - E2E-01 |
| PROF-02 | A win is counted | P1 | 1. Win a game. 2. Open Profile. | Win counter is 1, loss and draw stay 0. | Automated - E2E-05 |
| PROF-03 | A loss is counted | P1 | 1. Lose a game. 2. Open Profile. | Loss counter is 1. | Automated - E2E-06 |
| PROF-04 | Rename the player | P1 | 1. Open Profile. 2. Enter Vladyslav. 3. Press Save Changes. | Message Saved., greeting updates, statistics and history are carried over to the new name. | Automated - E2E-03 |
| PROF-05 | The new name survives a reload | P1 | 1. Rename. 2. Reload. | The renamed player is still logged in. | Automated - E2E-03 |
| PROF-06 | Rename to a name that is too short is blocked | P2 | 1. Enter a. 2. Press Save Changes. | The submit is blocked and the old name is kept. The profile form uses native validation, so the browser shows its own tooltip rather than an in-page message - see BUG-002. | Automated - E2E-03 |
| PROF-07 | Rename to a name owned by another player is refused | P2 | 1. Register Alice, log out, log in as Vlad. 2. Rename to Alice and save. | Error Another account already uses this name. The greeting keeps the old name and the field resets to it. Both accounts are untouched. | Automated - E2E-03 |
| PROF-08 | Delete the account | P1 | 1. Open Profile. 2. Press Delete Account. 3. Accept the confirm. | Confirm reads Delete this account and all its data? This cannot be undone. Afterwards the auth form is shown and the account is gone from ttt:users. | Automated - E2E-01, E2E-10 |
| PROF-09 | A deleted account cannot log in | P1 | 1. Delete the account. 2. Try to log in with the same name. | Error No account with this name. Please register. | Automated - E2E-01, E2E-10 |

---

## History

| ID | Title | Pri | Steps | Expected result | Status |
|---|---|---|---|---|---|
| HIST-01 | Empty state for a new player | P2 | 1. Register. 2. Open History. | Message No games yet. Play one!, no rows, Clear History is not shown. | Automated - E2E-01, E2E-07 |
| HIST-02 | A finished game is recorded | P1 | 1. Win a game on Hard. 2. Open History. | One row with a date, difficulty Hard and result Win. | Automated - E2E-01 |
| HIST-03 | A loss is recorded | P1 | 1. Lose a game. 2. Open History. | The row result reads Loss. | Automated - E2E-06 |
| HIST-04 | Newest game is listed first | P2 | 1. Play a win, then a loss. 2. Open History. | Two rows, the loss on top. | Automated - E2E-04 |
| HIST-05 | Clear History asks for confirmation | P1 | 1. Play a game. 2. Open History. 3. Press Clear History and accept. | Confirm reads Clear all game history?. Rows are removed and the empty state returns. | Automated - E2E-10 |
| HIST-06 | Cancelling the clear keeps the rows | P2 | 1. Press Clear History. 2. Dismiss the confirm. | Nothing is deleted. | Automated - E2E-10 |
| HIST-07 | History is per player | P1 | 1. Play a game as Vlad. 2. Log out and register Bob. 3. Open History. | Bob's history is empty. Vlad's games are untouched. | Automated - E2E-09 |

---

## Theme and language

| ID | Title | Pri | Steps | Expected result | Status |
|---|---|---|---|---|---|
| SET-01 | Toggle dark and light | P2 | 1. Press the theme button twice. | data-theme on <html> goes light to dark and back. The button label follows. | Automated - E2E-13 |
| SET-02 | Theme is kept after a reload | P2 | 1. Switch to dark. 2. Reload. | Still dark, value stored in ttt:theme. | Automated - E2E-13 |
| SET-03 | Switch to Persian and to RTL | P2 | 1. Choose Persian. | dir becomes rtl, navigation, buttons, status and table headers are in Persian. | Automated - E2E-13 |
| SET-04 | Language is kept after a reload | P2 | 1. Choose Persian. 2. Reload. | Still Persian and still RTL. | Automated - E2E-13 |
| SET-05 | The header is translated too | P3 | 1. Choose Persian. 2. Look at the header. | The subtitle is translated. Fails today - BUG-004. | Manual - open defect BUG-004 |
| SET-06 | Dark theme is readable in both languages | P3 | 1. Switch to dark. 2. Switch to Persian. 3. Walk through every screen. | Text stays legible, nothing overlaps, the winning highlight is still visible. | Manual |

---

## Interface, layout and console

| ID | Title | Pri | Steps | Expected result | Status |
|---|---|---|---|---|---|
| UI-01 | No console errors during the main flows | P1 | 1. Open DevTools. 2. Register, play a full game, visit every tab, switch theme and language, delete the account. | Console shows only the version line v0.0.9-beta. No errors, warnings or unhandled rejections. | Manual |
| UI-02 | Long player name does not break the layout | P2 | 1. Register with a 130-character name. | The card and the navigation stay inside the viewport, no horizontal page scroll. Fails today - BUG-005. | Manual - open defect BUG-005 |
| UI-03 | Layout on a small screen | P2 | 1. Set the viewport to 390x664. 2. Walk through every screen. | Content fits, no horizontal scrolling, controls remain tappable. | Automated - E2E-14 |
| UI-04 | Keyboard and screen-reader support on the board | P2 | 1. Tab to a cell and press Enter. 2. Inspect the status line and the cells. | The move is placed. Cells expose aria-label such as row 1, column 1, empty, the status line is role="status" with aria-live="polite". | Automated - E2E-14 |

---

## Negative and edge cases

| ID | Title | Pri | Steps | Expected result | Status |
|---|---|---|---|---|---|
| NEG-01 | Surrounding spaces are trimmed | P2 | 1. Register with    Vlad   . | Account is created as Vlad, greeting reads Hello, Vlad. | Automated - E2E-02 |
| NEG-02 | No move can be made while the computer is thinking | P1 | 1. Take a cell. 2. During Computer thinking... try to take another, including with a scripted click(). | All cells are disabled with aria-disabled="true" and the board does not change. | Automated - E2E-08 |
| NEG-03 | Cancelling the difficulty confirm changes nothing | P2 | 1. Make a move. 2. Change difficulty. 3. Press Cancel. | The select stays on the previous difficulty and the game in progress is untouched. | Manual |
| NEG-04 | Cancelling Clear History keeps the rows | P2 | 1. Play a game. 2. Press Clear History. 3. Press Cancel. | The row is still listed. | Automated - E2E-10 |
| NEG-05 | Cancelling Delete Account keeps the account | P1 | 1. Open Profile. 2. Press Delete Account. 3. Press Cancel. | Still logged in, the account still exists. | Automated - E2E-10 |
| NEG-06 | An abandoned game is not recorded | P2 | 1. Make one move. 2. Press New Game. 3. Open History. | No row is added; only finished games are recorded. | Automated - E2E-07, E2E-08 |
| NEG-07 | A session for a deleted account is handled | P1 | 1. Set ttt:users to {} and ttt:session to a name. 2. Reload. | The auth form is shown, no crash, no console error. | Automated - E2E-11 |
| NEG-08 | A very long name is accepted | P2 | 1. Register with a 132-character name. | The name is accepted with no maximum length, and the layout overflows. Fails today - BUG-005. | Manual - open defect BUG-005 |

---

## Security

There is no backend and no authentication secret, so this covers input handling, data isolation and storage robustness.

| ID | Title | Pri | Steps | Expected result | Status |
|---|---|---|---|---|---|
| SEC-01 | HTML in a player name is escaped | P1 | 1. Register as <img src=x onerror="window.__xss=1">. | The name is rendered as literal text, no img element is created and the handler does not run. | Automated - E2E-12 |
| SEC-02 | A script tag in a player name is escaped | P1 | 1. Register as <script>window.__xss=1</script>. | Rendered as text, no script element is injected, nothing executes. | Automated - E2E-12 |
| SEC-03 | The payload stays escaped on other screens | P1 | 1. Register with a payload name. 2. Open Profile. | The value appears in the field as text; nothing executes. | Automated - E2E-12 |
| SEC-04 | The app makes no external requests | P1 | 1. Register, play, open Profile and History while watching the network. | Every request goes to the app origin. No third-party or tracking calls. | Automated - E2E-12 |
| SEC-05 | Corrupted account storage is handled | P1 | 1. Set ttt:users to invalid JSON. 2. Reload. | The app renders and falls back to the auth form. No crash, no console error. | Automated - E2E-11 |
| SEC-06 | Data is isolated between players | P1 | 1. Play as Vlad. 2. Log out and register Bob. 3. Open History and Profile. | Bob sees an empty history and his own name. Vlad's data is not reachable. | Automated - E2E-09 |
| SEC-07 | Deleting one account leaves the others intact | P1 | 1. Register two accounts. 2. Delete one. | Only that account is removed from ttt:users. | Automated - E2E-09 |

---

## Accessibility

| ID | Title | Pri | Steps | Expected result | Status |
|---|---|---|---|---|---|
| A11Y-01 | The board works with the keyboard | P2 | 1. Tab to a cell. 2. Press Enter. | The mark is placed, same as a click. | Automated - E2E-14 |
| A11Y-02 | A validation error is announced and linked to the field | P2 | 1. Submit an invalid name. 2. Inspect the input. | The input carries aria-invalid and aria-describedby pointing at the error. Fails today - BUG-007. | Manual - open defect BUG-007 |
| A11Y-03 | The active navigation tab is exposed | P3 | 1. Open Profile. 2. Read the accessibility tree. | The active button is marked, for example aria-current="page". Fails today - BUG-008. | Manual - open defect BUG-008 |
| A11Y-04 | Board roles and labels are correct | P2 | 1. Inspect the board, cells and status. | Board is role="grid", cells are gridcell with labels like row 1, column 1, empty that update to row 1, column 1, X. Status is role="status" with aria- live="polite". | Automated - E2E-14 |
| A11Y-05 | Disabled cells are announced as disabled | P2 | 1. Take a cell. 2. Inspect another cell while the computer moves. | Cells expose aria-disabled="true". | Automated - E2E-14 |

---

## Layout and responsiveness

These run in every project, so each case is executed at desktop, mobile and tablet size.

| ID | Title | Pri | Steps | Expected result | Status |
|---|---|---|---|---|---|
| RESP-01 | The auth screen fits the viewport | P2 | 1. Open the app. | The form is visible and the page does not scroll horizontally. | Automated - E2E-14 |
| RESP-02 | Every logged in view fits the viewport | P2 | 1. Visit Play, Profile and History. | Each view is visible with no horizontal scrolling. | Automated - E2E-14 |
| RESP-03 | The board stays square and fully visible | P2 | 1. Open Play. | Cells are square within 2 px and the last cell is inside the viewport. | Automated - E2E-14 |
| RESP-04 | The main controls stay reachable | P2 | 1. Open Play. | Log Out, New Game and the difficulty select are all visible. | Automated - E2E-14 |
| RESP-05 | The layout holds in Persian | P2 | 1. Switch to Persian. | dir="rtl" and still no horizontal scrolling. | Automated - E2E-13 |
| UI-05 | Login mode is clearly signposted | P3 | 1. Switch to Log in. | The heading and subtitle should say the player is logging in, not "Welcome / Enter your name to start playing." Only the button and link change today. | Manual |

---

## Cross-browser

| ID | Title | Pri | Steps | Expected result | Status |
|---|---|---|---|---|---|
| XB-01 | The suite passes on Chromium, Firefox and WebKit | P1 | 1. npx playwright test. | All specs pass in all three desktop engines. | Automated - all 14 journeys |
| XB-02 | The suite passes on mobile Chrome and mobile Safari | P1 | 1. Same run, mobile-chrome and mobile-safari projects (Pixel 5, iPhone 13). | All specs pass, including touch interaction with the board. | Automated - all 14 journeys |
| XB-03 | The suite passes on a tablet viewport | P2 | 1. Same run, tablet project (iPad gen 7, landscape). | All specs pass. | Automated - all 14 journeys |

---

## End-to-end journeys

Continuous scenarios rather than isolated checks: every step depends on the one before it, so these catch problems that only appear when the features are used together. All 14 are automated and run in every browser project.

| ID | Journey | Pri | Chained steps | Expected outcome | Status | Covered by |
|---|---|---|---|---|---|---|
| E2E-01 | Critical path, registration to deletion | P1 | Register Smoke -> play a game to a result -> open History -> open Profile -> rename to Smokey -> dark + Persian -> reload -> log out -> log in as Smokey -> try the old name -> clear history -> delete the account -> try to log in | The finished game appears in History with the right result and difficulty, the matching Profile counter reads 1, the rename keeps the record, theme, language, name and session all survive the reload together, the new name logs in while the old one is rejected, clearing empties the table, and the deleted account cannot log in | Automated | e2e/account.e2e.spec.ts |
| E2E-02 | Sign-up validation, every rejection then success | P1 | Empty name -> one character -> spaces only -> valid name with padding -> log out -> register the same name again -> log in as an unknown name -> log in with different casing | Each invalid attempt shows its own message and creates nothing; the valid name is trimmed and accepted; the duplicate is refused; the unknown login is refused; the real account logs in regardless of casing | Automated | e2e/account.e2e.spec.ts |
| E2E-03 | Rename, refused then blocked then accepted | P1 | Create Alice and Vlad -> win a game as Vlad -> rename to Alice -> rename to a -> rename to Vladyslav -> reload -> log out -> try the old name -> log in as the new one -> check Alice | The taken name is refused in-page, the short name is blocked by the form, the valid rename carries statistics and history across, the new name survives a reload and a fresh login, the old name is gone, and the other account is untouched | Automated | e2e/account.e2e.spec.ts |
| E2E-04 | Returning player, statistics accumulate | P1 | Play a game -> log out -> log back in -> check the record -> play a second game -> check history and counters -> reload | The record survives the logout, the second game is added rather than replacing the first, history lists both newest first, the profile totals match the two results, and a reload changes nothing | Automated | e2e/account.e2e.spec.ts |
| E2E-05 | Winning run from first move to record | P1 | Empty board -> play to a win -> check the status and highlight -> check the board is locked -> open History -> open Profile -> start a new game | The win is announced with three highlighted cells, the finished board is fully disabled, the win reaches history and the profile together, and a new game starts clean without touching the record | Automated | e2e/gameplay.e2e.spec.ts |
| E2E-06 | Losing run on Hard, then a win | P1 | Set Hard -> play to a loss -> open History -> open Profile -> switch to Easy -> play to a result | The loss is announced, recorded against Hard and counted as a loss with no win, and the later game is added alongside it with the loss still listed underneath | Automated | e2e/gameplay.e2e.spec.ts |
| E2E-07 | All three difficulties in one sitting | P2 | Make a move on Easy -> switch to Medium -> check history -> finish a Medium game -> switch to Hard -> finish -> switch to Easy -> finish -> open History -> reload | Switching mid-game asks for confirmation and clears the board, the abandoned game is not recorded, switching after a finished game does not ask again, all three games are listed newest first with the right difficulty, and the last difficulty is remembered | Automated | e2e/gameplay.e2e.spec.ts |
| E2E-08 | Turn rules and in-game controls across one sitting | P2 | Request a hint -> make a move -> press Reset -> check history -> play to a result -> press New Game -> check history | The hint highlights a free cell without playing it, the move is placed and locked, Reset clears the board without recording anything, and New Game clears the board while the finished game stays on record | Automated | e2e/gameplay.e2e.spec.ts |
| E2E-09 | Two players, records stay apart | P1 | Alice wins a game -> log out -> register Bob -> check Bob is empty -> Bob loses a game -> log back in as Alice -> delete Alice -> log in as Bob | Bob starts from nothing, each player only ever sees his own record, deleting one account removes only that account, and the other keeps its history | Automated | e2e/data.e2e.spec.ts |
| E2E-10 | Destructive actions, cancel then confirm | P1 | Record two games -> cancel Clear History -> confirm Clear History -> cancel Delete Account -> confirm Delete Account -> try to log in | Cancelling keeps the rows and keeps the player logged in; confirming empties the table and then removes the account for good, after which the name no longer logs in | Automated | e2e/data.e2e.spec.ts |
| E2E-11 | Damaged storage, recover and carry on | P1 | Record a game -> point the session at a missing account -> reload -> log in again -> write invalid JSON into storage -> reload -> register a fresh account -> play a game | The dangling session falls back to the auth form with the record intact, invalid JSON does not break the page, and a new account can be created and used normally afterwards | Automated | e2e/data.e2e.spec.ts |
| E2E-12 | Hostile input stays text everywhere | P1 | Register with an img/onerror payload as the name -> check the greeting -> open Profile -> play a game -> rename to a script payload -> check the network | The payload is rendered as literal text in every place the name appears, no element is injected, nothing executes, the game records normally, and no request leaves the app origin during the whole journey | Automated | e2e/data.e2e.spec.ts |
| E2E-13 | Theme and language together, every view | P2 | Check the defaults -> switch to dark -> visit Play, Profile and History -> switch to Persian -> visit the views again -> reload -> switch back to English -> switch back to light | Dark holds across every view, Persian translates the navigation, titles and document title and flips the page to RTL with no horizontal scrolling, both choices survive a reload, and the two settings can be reversed independently | Automated | e2e/presentation.e2e.spec.ts |
| E2E-14 | Keyboard, ARIA and layout at the current viewport | P1 | Set Hard, dark and a language -> play a game -> rename -> reload -> check every piece -> log out -> log back in | Theme, name, difficulty and history all come back together after the reload, logging out and back in rebuilds the same session, and the theme outlives the logout | Automated | e2e/presentation.e2e.spec.ts |
