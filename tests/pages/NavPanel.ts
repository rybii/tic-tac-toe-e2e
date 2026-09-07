import { Locator, test } from '@playwright/test';
import { BasePage } from './BasePage';

export class NavPanel extends BasePage {
  readonly root: Locator = this.page.getByTestId('nav');
  readonly avatar: Locator = this.page.getByTestId('avatar');
  readonly greeting: Locator = this.page.getByTestId('hello-user');
  readonly playTab: Locator = this.page.getByTestId('nav-play');
  readonly profileTab: Locator = this.page.getByTestId('nav-profile');
  readonly historyTab: Locator = this.page.getByTestId('nav-history');
  readonly logoutButton: Locator = this.page.getByTestId('btn-logout');

  async openPlay(): Promise<void> {
    await test.step('Open Play tab', async () => this.playTab.click());
  }

  async openProfile(): Promise<void> {
    await test.step('Open Profile tab', async () => this.profileTab.click());
  }

  async openHistory(): Promise<void> {
    await test.step('Open History tab', async () => this.historyTab.click());
  }

  async logout(): Promise<void> {
    await test.step('Log out', async () => this.logoutButton.click());
  }
}
