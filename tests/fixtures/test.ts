import { test as base } from '@playwright/test';
import { AuthPage } from '../pages/AuthPage';
import { GamePage } from '../pages/GamePage';
import { HeaderPanel } from '../pages/HeaderPanel';
import { HistoryPage } from '../pages/HistoryPage';
import { NavPanel } from '../pages/NavPanel';
import { ProfilePage } from '../pages/ProfilePage';
import { GameFeature } from '../features/GameFeature';
import { DialogHandler } from '../helpers/DialogHandler';

type Fixtures = {
  auth: AuthPage;
  game: GamePage;
  gameplay: GameFeature;
  header: HeaderPanel;
  history: HistoryPage;
  nav: NavPanel;
  profile: ProfilePage;
  dialogs: DialogHandler;
  player: string;
};

export const test = base.extend<Fixtures>({
  page: async ({ page }, use) => {
    await page.goto('/');
    await use(page);
  },

  dialogs: [
    async ({ page }, use) => {
      await use(new DialogHandler(page));
    },
    { auto: true },
  ],

  auth: async ({ page }, use) => use(new AuthPage(page)),
  game: async ({ page }, use) => use(new GamePage(page)),
  gameplay: async ({ game }, use) => use(new GameFeature(game)),
  header: async ({ page }, use) => use(new HeaderPanel(page)),
  history: async ({ page }, use) => use(new HistoryPage(page)),
  nav: async ({ page }, use) => use(new NavPanel(page)),
  profile: async ({ page }, use) => use(new ProfilePage(page)),

  /** Registers a player so tests can start from the logged in state. */
  player: async ({ auth, nav }, use) => {
    const name = 'Vlad';
    await auth.register(name);
    await nav.greeting.waitFor();
    await use(name);
  },
});

export { expect } from '@playwright/test';
