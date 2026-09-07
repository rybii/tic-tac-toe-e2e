import { expect, test } from '../../fixtures/test';
import { STORAGE_KEYS } from '../../data/app';

/**
 * Journeys around the account itself. Every step depends on the previous one,
 * so these catch problems that only appear when the features run together.
 */

test('E2E-01 critical path: register, play, record, rename, persist, delete', async ({
  auth,
  nav,
  game,
  gameplay,
  history,
  profile,
  header,
  page,
}) => {
  await test.step('register a new player', async () => {
    await auth.register('Smoke');
    await expect(nav.greeting).toHaveText('Hello, Smoke');
    await expect(game.board).toBeVisible();
  });

  let result: 'Win' | 'Loss' | 'Draw';
  await test.step('play a game through to a result', async () => {
    await gameplay.selectDifficulty('easy');
    await gameplay.playToWin();
    result = await gameplay.result();
  });

  await test.step('the game appears in history', async () => {
    await nav.openHistory();
    await expect(history.rows).toHaveCount(1);
    await expect(history.result(0)).toHaveText(result);
    await expect(history.difficulty(0)).toHaveText('Easy');
    await expect(history.date(0)).not.toBeEmpty();
  });

  await test.step('the profile counters agree with the history', async () => {
    await nav.openProfile();
    const counter = { Win: profile.wins, Loss: profile.losses, Draw: profile.draws }[result];
    await expect(counter).toHaveText('1');
    await expect(profile.created).not.toBeEmpty();
  });

  await test.step('rename the player and keep the record', async () => {
    await profile.rename('Smokey');
    await expect(profile.message).toHaveText('Saved.');
    await expect(nav.greeting).toHaveText('Hello, Smokey');

    await nav.openHistory();
    await expect(history.rows).toHaveCount(1);
  });

  await test.step('switch theme and language', async () => {
    await header.toggleTheme();
    await header.selectLanguage('fa');

    expect(await header.currentTheme()).toBe('dark');
    expect(await header.textDirection()).toBe('rtl');
  });

  await test.step('a reload keeps session, name, theme and language together', async () => {
    await page.reload();

    expect(await header.currentTheme()).toBe('dark');
    expect(await header.textDirection()).toBe('rtl');
    await expect(nav.greeting).toContainText('Smokey');
  });

  await test.step('log out and back in under the new name', async () => {
    await header.selectLanguage('en');
    await nav.logout();
    await auth.login('Smokey');

    await expect(nav.greeting).toHaveText('Hello, Smokey');
  });

  await test.step('the old name no longer exists', async () => {
    await nav.logout();
    await auth.login('Smoke');

    await expect(auth.error).toHaveText('No account with this name. Please register.');
  });

  await test.step('history survived all of that, then clear it', async () => {
    await auth.login('Smokey');
    await nav.openHistory();
    await expect(history.rows).toHaveCount(1);

    await history.clear();
    await expect(history.emptyMessage).toHaveText('No games yet. Play one!');
    await expect(history.clearButton).toBeHidden();
  });

  await test.step('delete the account and confirm it is gone', async () => {
    await nav.openProfile();
    await profile.deleteAccount();
    await expect(auth.form).toBeVisible();

    await auth.login('Smokey');
    await expect(auth.error).toHaveText('No account with this name. Please register.');
    expect(await page.evaluate((keys) => localStorage.getItem(keys.users), STORAGE_KEYS)).toBe('{}');
  });
});

test('E2E-02 sign-up and login: every rejection, then a working session', async ({
  auth,
  nav,
  game,
  page,
}) => {
  await test.step('an empty name is rejected', async () => {
    await auth.register('');
    await expect(auth.error).toHaveText('Please enter a name.');
    await expect(nav.root).toBeHidden();
  });

  await test.step('a single character is rejected', async () => {
    await auth.register('J');
    await expect(auth.error).toHaveText('Name must be at least 2 characters.');
  });

  await test.step('whitespace only is rejected', async () => {
    await auth.register('   ');
    await expect(auth.error).toHaveText('Please enter a name.');
  });

  await test.step('a valid name is accepted and the padding is trimmed', async () => {
    await auth.register('  Vlad  ');
    await expect(nav.greeting).toHaveText('Hello, Vlad');
    await expect(game.board).toBeVisible();
  });

  await test.step('the session survives a reload', async () => {
    await page.reload();
    await expect(nav.greeting).toHaveText('Hello, Vlad');
  });

  await test.step('logging out clears the session but keeps the account', async () => {
    await nav.logout();
    await expect(auth.form).toBeVisible();
    expect(await page.evaluate((keys) => localStorage.getItem(keys.session), STORAGE_KEYS)).toBeNull();
  });

  await test.step('the same name cannot be registered twice, whatever the casing', async () => {
    await auth.register('vlad');
    await expect(auth.error).toHaveText('This name is already taken. Try logging in.');
  });

  await test.step('an unknown name cannot log in', async () => {
    await auth.login('ghost');
    await expect(auth.error).toHaveText('No account with this name. Please register.');
  });

  await test.step('the real account logs in whatever the casing', async () => {
    await auth.login('VLAD');
    await expect(nav.greeting).toHaveText('Hello, Vlad');
  });
});

test('E2E-03 rename: refused, blocked, then accepted and carried everywhere', async ({
  auth,
  nav,
  gameplay,
  profile,
  history,
  page,
}) => {
  await test.step('two accounts exist and the second has a game on record', async () => {
    await auth.register('Alice');
    await nav.logout();
    await auth.register('Vlad');
    await gameplay.selectDifficulty('hard');
    await gameplay.playToWin();
    await nav.openProfile();
    await expect(profile.wins).toHaveText('1');
  });

  await test.step('a name another account owns is refused in the page', async () => {
    await profile.rename('Alice');
    await expect(profile.error).toHaveText('Another account already uses this name.');
    await expect(nav.greeting).toHaveText('Hello, Vlad');
    await expect(profile.nameInput).toHaveValue('Vlad');
  });

  await test.step('a name that is too short is blocked by the form itself', async () => {
    await profile.rename('a');
    expect(await profile.isNameTooShort()).toBe(true);
    await expect(nav.greeting).toHaveText('Hello, Vlad');
  });

  await test.step('a valid name is saved and the record follows it', async () => {
    await profile.rename('Vladyslav');
    await expect(profile.message).toHaveText('Saved.');
    await expect(nav.greeting).toHaveText('Hello, Vladyslav');
    await expect(profile.wins).toHaveText('1');

    await nav.openHistory();
    await expect(history.rows).toHaveCount(1);
  });

  await test.step('the new name survives a reload and a fresh login', async () => {
    await page.reload();
    await expect(nav.greeting).toHaveText('Hello, Vladyslav');

    await nav.logout();
    await auth.login('Vlad');
    await expect(auth.error).toHaveText('No account with this name. Please register.');

    await auth.login('Vladyslav');
    await expect(nav.greeting).toHaveText('Hello, Vladyslav');
  });

  await test.step('the other account was never touched', async () => {
    await nav.logout();
    await auth.login('Alice');
    await expect(nav.greeting).toHaveText('Hello, Alice');
    await nav.openProfile();
    await expect(profile.wins).toHaveText('0');
  });
});

test('E2E-04 returning player: statistics accumulate across sessions', async ({
  auth,
  nav,
  gameplay,
  profile,
  history,
  page,
}) => {
  let first: string;
  await test.step('play one game and log out', async () => {
    await auth.register('Vlad');
    await gameplay.selectDifficulty('easy');
    await gameplay.playToWin();
    first = await gameplay.result();
    await nav.logout();
  });

  await test.step('logging back in restores the record', async () => {
    await auth.login('Vlad');
    await nav.openHistory();
    await expect(history.rows).toHaveCount(1);
    await expect(history.result(0)).toHaveText(first);
  });

  let second: string;
  await test.step('a second game adds to the record rather than replacing it', async () => {
    await nav.openPlay();
    await gameplay.startNewGame();
    await gameplay.playToWin();
    second = await gameplay.result();

    await nav.openHistory();
    await expect(history.rows).toHaveCount(2);
    await expect(history.result(0)).toHaveText(second);
    await expect(history.result(1)).toHaveText(first);
  });

  await test.step('the profile totals match the two games', async () => {
    await nav.openProfile();
    const played = [first, second];
    await expect(profile.wins).toHaveText(String(played.filter((r) => r === 'Win').length));
    await expect(profile.losses).toHaveText(String(played.filter((r) => r === 'Loss').length));
    await expect(profile.draws).toHaveText(String(played.filter((r) => r === 'Draw').length));
  });

  await test.step('a reload changes none of it', async () => {
    await page.reload();
    await nav.openHistory();
    await expect(history.rows).toHaveCount(2);
  });
});
