import { expect, test } from '../../fixtures/test';
import { STORAGE_KEYS } from '../../data/app';

/** Journeys about the data the app keeps: whose it is, and how it is destroyed. */

test('E2E-09 two players: records stay apart from start to finish', async ({
  auth,
  nav,
  gameplay,
  history,
  profile,
}) => {
  let aliceResult: string;
  await test.step('the first player builds a record', async () => {
    await auth.register('Alice');
    await gameplay.selectDifficulty('easy');
    await gameplay.playToWin();
    aliceResult = await gameplay.result();

    await nav.openHistory();
    await expect(history.rows).toHaveCount(1);
    await expect(history.result(0)).toHaveText(aliceResult);
  });

  await test.step('a second player starts from nothing', async () => {
    await nav.logout();
    await auth.register('Bob');

    await nav.openHistory();
    await expect(history.rows).toHaveCount(0);
    await nav.openProfile();
    await expect(profile.wins).toHaveText('0');
  });

  await test.step('the second player plays, and only his own record changes', async () => {
    await nav.openPlay();
    await gameplay.selectDifficulty('hard');
    await gameplay.playToLose();

    await nav.openHistory();
    await expect(history.rows).toHaveCount(1);
    await expect(history.result(0)).toHaveText('Loss');
  });

  await test.step('the first player is untouched', async () => {
    await nav.logout();
    await auth.login('Alice');

    await nav.openHistory();
    await expect(history.rows).toHaveCount(1);
    await expect(history.result(0)).toHaveText(aliceResult);
  });

  await test.step('deleting the first player leaves the second one intact', async () => {
    await nav.openProfile();
    await profile.deleteAccount();
    await expect(auth.form).toBeVisible();

    await auth.login('Alice');
    await expect(auth.error).toHaveText('No account with this name. Please register.');

    await auth.login('Bob');
    await expect(nav.greeting).toHaveText('Hello, Bob');
    await nav.openHistory();
    await expect(history.rows).toHaveCount(1);
  });
});

test('E2E-10 destructive actions: cancel keeps everything, confirm removes it', async ({
  player,
  auth,
  nav,
  gameplay,
  history,
  profile,
  dialogs,
}) => {
  await test.step('build a record of two games', async () => {
    await gameplay.selectDifficulty('easy');
    await gameplay.playToWin();
    await gameplay.startNewGame();
    await gameplay.playToWin();

    await nav.openHistory();
    await expect(history.rows).toHaveCount(2);
  });

  await test.step('cancelling Clear History keeps the rows', async () => {
    dialogs.cancelNext();
    await history.clearButton.click();
    await expect(history.rows).toHaveCount(2);
  });

  await test.step('confirming Clear History empties the table', async () => {
    await history.clear();
    await expect.poll(() => dialogs.messages).toContain('Clear all game history?');
    await expect(history.rows).toHaveCount(0);
    await expect(history.emptyMessage).toBeVisible();
  });

  await test.step('cancelling Delete Account keeps the player logged in', async () => {
    await nav.openProfile();
    dialogs.cancelNext();
    await profile.deleteAccountButton.click();

    await expect(nav.greeting).toHaveText('Hello, Vlad');
    await expect(auth.form).toBeHidden();
  });

  await test.step('confirming Delete Account removes it for good', async () => {
    await profile.deleteAccount();
    await expect
      .poll(() => dialogs.messages)
      .toContain('Delete this account and all its data? This cannot be undone.');
    await expect(auth.form).toBeVisible();

    await auth.login('Vlad');
    await expect(auth.error).toHaveText('No account with this name. Please register.');
  });
});

test('E2E-11 damaged storage: the app recovers and can be used again', async ({
  auth,
  nav,
  gameplay,
  history,
  page,
}) => {
  await test.step('a player with a game on record', async () => {
    await auth.register('Vlad');
    await gameplay.selectDifficulty('easy');
    await gameplay.playToWin();
    await nav.openHistory();
    await expect(history.rows).toHaveCount(1);
  });

  await test.step('a session pointing at nothing falls back to the auth form', async () => {
    await page.evaluate((keys) => localStorage.setItem(keys.session, 'Ghost'), STORAGE_KEYS);
    await page.reload();

    await expect(auth.form).toBeVisible();
    await expect(nav.root).toBeHidden();
  });

  await test.step('the real account still logs in with its record intact', async () => {
    await auth.login('Vlad');
    await nav.openHistory();
    await expect(history.rows).toHaveCount(1);
  });

  await test.step('invalid JSON in storage does not break the page', async () => {
    await page.evaluate((keys) => localStorage.setItem(keys.users, '{not valid json'), STORAGE_KEYS);
    await page.reload();

    await expect(page.getByTestId('app')).toBeVisible();
    await expect(auth.form).toBeVisible();
  });

  await test.step('a fresh account can be created after the damage', async () => {
    await auth.register('Recovered');
    await expect(nav.greeting).toHaveText('Hello, Recovered');

    await gameplay.selectDifficulty('easy');
    await gameplay.playToWin();
    await nav.openHistory();
    await expect(history.rows).toHaveCount(1);
  });
});

test('E2E-12 hostile input: markup in a name stays text everywhere it is shown', async ({
  auth,
  nav,
  gameplay,
  history,
  profile,
  page,
}) => {
  const payload = '<img src=x onerror="window.__xss=1">';
  const external: string[] = [];
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:4173')) external.push(request.url());
  });

  await test.step('the payload can be registered and is escaped in the greeting', async () => {
    await auth.register(payload);
    await expect(nav.greeting).toHaveText(`Hello, ${payload}`);
    expect(await page.locator('[data-testid=hello-user] img').count()).toBe(0);
    expect(await page.evaluate(() => (window as any).__xss)).toBeUndefined();
  });

  await test.step('it stays text on the profile screen', async () => {
    await nav.openProfile();
    await expect(profile.nameInput).toHaveValue(payload);
    expect(await page.evaluate(() => (window as any).__xss)).toBeUndefined();
  });

  await test.step('playing a game with that name records normally', async () => {
    await nav.openPlay();
    await gameplay.selectDifficulty('easy');
    await gameplay.playToWin();

    await nav.openHistory();
    await expect(history.rows).toHaveCount(1);
  });

  await test.step('renaming to a second payload is also escaped', async () => {
    await nav.openProfile();
    await profile.rename('<script>window.__xss=1</script>');

    await expect(profile.message).toHaveText('Saved.');
    expect(await page.locator('[data-testid=hello-user] script').count()).toBe(0);
    expect(await page.evaluate(() => (window as any).__xss)).toBeUndefined();
  });

  await test.step('nothing left the app origin during the whole journey', async () => {
    expect(external).toEqual([]);
  });
});
