import { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';

/** Journeys about how the app presents itself, and how it behaves at each size. */

const hasHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);

test('E2E-13 appearance: theme and language together, across every view', async ({
  player,
  header,
  nav,
  game,
  profile,
  history,
  page,
}) => {
  await test.step('the app starts light and left to right', async () => {
    expect(await header.currentTheme()).toBe('light');
    expect(await header.textDirection()).toBe('ltr');
    await expect(header.themeButton).toHaveText('Dark');
  });

  await test.step('dark theme holds on every view', async () => {
    await header.toggleTheme();
    expect(await header.currentTheme()).toBe('dark');
    await expect(header.themeButton).toHaveText('Light');

    await nav.openProfile();
    await expect(profile.view).toBeVisible();
    await nav.openHistory();
    await expect(history.view).toBeVisible();
    await nav.openPlay();
    await expect(game.board).toBeVisible();

    expect(await header.currentTheme()).toBe('dark');
  });

  await test.step('Persian switches the whole interface and the direction', async () => {
    await header.selectLanguage('fa');

    expect(await header.textDirection()).toBe('rtl');
    await expect(nav.playTab).toHaveText('بازی');
    await expect(nav.logoutButton).toHaveText('خروج');
    await expect(page).toHaveTitle('دوز');
  });

  await test.step('Persian holds on the other views without breaking the layout', async () => {
    await nav.openHistory();
    await expect(history.title).toHaveText('تاریخچهٔ بازی‌ها');
    expect(await hasHorizontalScroll(page)).toBe(false);

    await nav.openPlay();
    expect(await hasHorizontalScroll(page)).toBe(false);
  });

  await test.step('a reload keeps both choices', async () => {
    await page.reload();
    expect(await header.currentTheme()).toBe('dark');
    expect(await header.textDirection()).toBe('rtl');
  });

  await test.step('the two settings can be reversed independently', async () => {
    await header.selectLanguage('en');
    expect(await header.textDirection()).toBe('ltr');
    expect(await header.currentTheme()).toBe('dark');

    await header.toggleTheme();
    expect(await header.currentTheme()).toBe('light');
    await expect(nav.playTab).toHaveText('Play');
  });
});

test('E2E-14 keyboard and layout: usable without a mouse, at this viewport', async ({
  player,
  auth,
  nav,
  game,
  profile,
  history,
  page,
}) => {
  await test.step('the board exposes a grid with labelled cells', async () => {
    await expect(game.board).toHaveAttribute('role', 'grid');
    await expect(game.status).toHaveAttribute('role', 'status');
    await expect(game.status).toHaveAttribute('aria-live', 'polite');
    await expect(game.cell(0)).toHaveAttribute('aria-label', 'row 1, column 1, empty');
  });

  await test.step('a move can be made with the keyboard alone', async () => {
    await game.cell(0).focus();
    await game.cell(0).press('Enter');
    await game.waitForComputer();

    await expect(game.cell(0)).toHaveAttribute('data-state', 'x');
    await expect(game.cell(0)).toHaveAttribute('aria-label', 'row 1, column 1, X');
    await expect(game.cell(0)).toHaveAttribute('aria-disabled', 'true');
  });

  await test.step('the play view fits the viewport', async () => {
    expect(await hasHorizontalScroll(page)).toBe(false);
    await expect(game.newGameButton).toBeVisible();
    await expect(game.difficultySelect).toBeVisible();
    await expect(nav.logoutButton).toBeVisible();
  });

  await test.step('the board stays square and the last cell is reachable', async () => {
    const cell = await game.cell(0).boundingBox();
    expect(cell).not.toBeNull();
    expect(Math.abs(cell!.width - cell!.height)).toBeLessThanOrEqual(2);
    await expect(game.cell(8)).toBeInViewport();
  });

  await test.step('profile and history fit the viewport too', async () => {
    await nav.openProfile();
    await expect(profile.view).toBeVisible();
    expect(await hasHorizontalScroll(page)).toBe(false);

    await nav.openHistory();
    await expect(history.view).toBeVisible();
    expect(await hasHorizontalScroll(page)).toBe(false);
  });

  await test.step('the auth screen fits as well', async () => {
    await nav.logout();
    await expect(auth.form).toBeVisible();
    expect(await hasHorizontalScroll(page)).toBe(false);
  });
});
