import { Locator, test } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProfilePage extends BasePage {
  readonly view: Locator = this.page.getByTestId('view-profile');
  readonly title: Locator = this.page.getByTestId('profile-title');
  readonly nameInput: Locator = this.page.getByTestId('input-profile-name');
  readonly saveButton: Locator = this.page.getByTestId('btn-save-profile');
  readonly message: Locator = this.page.getByTestId('profile-message');
  readonly error: Locator = this.page.getByTestId('profile-error');
  readonly created: Locator = this.page.getByTestId('profile-created');
  readonly wins: Locator = this.page.getByTestId('profile-wins');
  readonly losses: Locator = this.page.getByTestId('profile-losses');
  readonly draws: Locator = this.page.getByTestId('profile-draws');
  readonly deleteAccountButton: Locator = this.page.getByTestId('btn-delete-account');

  /**
   * Submits from the field rather than the button: a long display name pushes the
   * button out of a phone viewport, which is BUG-005.
   */
  async rename(name: string): Promise<void> {
    await test.step(`Rename player to "${name}"`, async () => {
      await this.nameInput.fill(name);
      await this.nameInput.press('Enter');
    });
  }

  /** The profile form keeps native validation on, so the browser blocks a short name. */
  isNameTooShort(): Promise<boolean> {
    return this.nameInput.evaluate((input) => (input as HTMLInputElement).validity.tooShort);
  }

  async deleteAccount(): Promise<void> {
    await test.step('Delete the account', async () => {
      await this.deleteAccountButton.click();
    });
  }
}
