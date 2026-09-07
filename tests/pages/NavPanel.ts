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
    await test.step('Open Play tab', async () => this.open(this.playTab, 'view-play'));
  }

  async openProfile(): Promise<void> {
    await test.step('Open Profile tab', async () => this.open(this.profileTab, 'view-profile'));
  }

  async openHistory(): Promise<void> {
    await test.step('Open History tab', async () => this.open(this.historyTab, 'view-history'));
  }

  async logout(): Promise<void> {
    await test.step('Log out', async () => {
      await this.logoutButton.click();
      await this.page.getByTestId('auth-form').waitFor();
    });
  }

  /** Views are swapped in place, so wait for the new one before touching it. */
  private async open(tab: Locator, view: string): Promise<void> {
    await tab.click();
    await this.page.getByTestId(view).waitFor();
  }
}
