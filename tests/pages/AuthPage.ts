import { Locator, test } from '@playwright/test';
import { BasePage } from './BasePage';

export class AuthPage extends BasePage {
  readonly form: Locator = this.page.getByTestId('auth-form');
  readonly title: Locator = this.page.getByTestId('auth-title');
  readonly nameInput: Locator = this.page.getByTestId('input-name');
  readonly registerButton: Locator = this.page.getByTestId('btn-register');
  readonly loginButton: Locator = this.page.getByTestId('btn-login');
  readonly switchModeButton: Locator = this.page.getByTestId('btn-switch-mode');
  readonly error: Locator = this.page.getByTestId('auth-error');

  async register(name: string): Promise<void> {
    await test.step(`Register as "${name}"`, async () => {
      await this.nameInput.fill(name);
      await this.registerButton.click();
    });
  }

  async login(name: string): Promise<void> {
    await test.step(`Log in as "${name}"`, async () => {
      await this.switchToLogin();
      await this.nameInput.fill(name);
      await this.loginButton.click();
    });
  }

  async switchToLogin(): Promise<void> {
    if (await this.loginButton.isVisible()) return;
    await this.switchModeButton.click();
  }

  async switchToRegister(): Promise<void> {
    if (await this.registerButton.isVisible()) return;
    await this.switchModeButton.click();
  }
}
